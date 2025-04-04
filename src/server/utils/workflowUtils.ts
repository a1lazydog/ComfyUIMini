import path from 'path';
import fs from 'fs';
import config from 'config';
import logger from './logger';
import paths from './paths';
import { Workflow, WorkflowFileReadError, WorkflowWithMetadata } from '@shared/types/Workflow';
import { WorkflowInstance } from '@shared/classes/Workflow';

export interface ServerWorkflowMetadata {
    title: string;
    filename: string;
    description: string;
}

export type ServerWorkflowMetadataList = Record<string, ServerWorkflowMetadata>;

let fetchedWorkflowMetadata: ServerWorkflowMetadataList = {};

function serverWorkflowsCheck(): void {
    checkForWorkflowsFolder();

    const jsonFileList = getWorkflowFolderJsonFiles();
    const fetchedServerWorkflowMetadata = getServerWorkflowMetadata(jsonFileList);

    fetchedWorkflowMetadata = fetchedServerWorkflowMetadata;
}

/**
 * Checks if the server workflows folder path exists, if not, tries to creates it.
 */
function checkForWorkflowsFolder() {
    if (!fs.existsSync(paths.workflows)) {
        logger.warn(`Server workflows folder path from config not found, attempting to create...`);

        try {
            fs.mkdirSync(paths.workflows);
            logger.success(`Server workflows folder created at '${paths.workflows}'`);
        } catch (err) {
            console.error(`Error creating server workflows directory: ${err}`);
        }

        return;
    }

    return;
}

/**
 * Reads the server workflows folder for JSON files.
 *
 * @returns {string[]} An array of JSON filenames in the workflows folder.
 */
function getWorkflowFolderJsonFiles(): string[] {
    const filesList = fs.readdirSync(paths.workflows);
    const jsonFilesList = filesList.filter((file) => path.extname(file).toLowerCase() === '.json');

    return jsonFilesList;
}

/**
 * Checks if a JSON workflow object is a valid ComfyUI workflow.
 *
 * @param {object} workflowJson The workflow object.
 * @returns {boolean} True if workflow is a valid ComfyUI workflow, otherwise false.
 */
function checkIfObjectIsValidWorkflow(workflowJson: { [key: string]: any }): boolean {
    if (typeof workflowJson !== 'object') {
        return false;
    }

    for (const key of Object.keys(workflowJson)) {
        const node = workflowJson[key];

        if (node && typeof node === 'object' && 'inputs' in node && typeof node.inputs === 'object') {
            return true;
        }
    }

    return false;
}

/**
 * Attempts to get text metadata for all workflows in the server workflows folder.
 *
 * @param {string[]} jsonFileList List of JSON files in the workflows folder.
 * @returns {ServerWorkflowMetadataList} An object containing the metadata for each workflow.
 */
function getServerWorkflowMetadata(jsonFileList: string[]): ServerWorkflowMetadataList {
    const accumulatedWorkflowMetadata: ServerWorkflowMetadataList = {};

    for (const jsonFilename of jsonFileList) {
        const jsonFileContents = fs.readFileSync(path.join(paths.workflows, jsonFilename), 'utf8');
        const parsedJsonContents = JSON.parse(jsonFileContents);

        if (!checkIfObjectIsValidWorkflow(parsedJsonContents)) {
            continue;
        }

        const jsonMetadata = parsedJsonContents['_comfyuimini_meta'];

        if (!jsonMetadata) {
            try {
                generateWorkflowMetadataAndSaveToFile(parsedJsonContents, jsonFilename);
            } catch (error) {
                console.log(`Error when auto-generating metadata for workflow '${jsonFilename}': ${error}`);
                continue;
            }

            accumulatedWorkflowMetadata[`[CONVERTED] ${jsonFilename}`] = {
                title: jsonFilename,
                filename: `[CONVERTED] ${jsonFilename}`,
                description: 'A ComfyUI workflow.',
            };

            continue;
        }

        accumulatedWorkflowMetadata[jsonFilename] = {
            title: jsonMetadata.title,
            filename: jsonFilename,
            description: jsonMetadata.description,
        };
    }

    logger.info(`Found ${Object.keys(accumulatedWorkflowMetadata).length} valid workflows in the workflow folder.`);

    return accumulatedWorkflowMetadata;
}

/**
 * Auto-generates metadata for a workflow object and saves it to a new file with a [CONVERTED] prefix while keeping a backup of the original file.
 *
 * @param {Workflow} workflowObjectWithoutMetadata The workflow object without metadata.
 * @param {string} workflowFilename The filename of the workflow in the workflows folder.
 */
function generateWorkflowMetadataAndSaveToFile(workflowObjectWithoutMetadata: Workflow, workflowFilename: string) {
    if (config.get('auto_convert_comfyui_workflows') === false) {
        return;
    }

    const validateErrorMessage = WorkflowInstance.validateWorkflowObject(workflowObjectWithoutMetadata, true);
    if (validateErrorMessage) {
        logger.warn(`${workflowFilename} was not recognized as a valid ComfyUI workflow: ${validateErrorMessage}`);
    }

    const workflowWithGenMetadata = WorkflowInstance.generateMetadataForWorkflow(
        workflowObjectWithoutMetadata,
        workflowFilename,
        config.get('hide_all_input_on_auto_covert')
    );

    try {
        writeConvertedWorkflowToFile(workflowWithGenMetadata, workflowFilename);
    } catch (error) {
        logger.error(`Error when saving converted workflow to file: ${error}`);
        return;
    }

    logger.info(
        `Created auto-generated ComfyUIMini metadata for '${workflowFilename}', to disable this feature you can disable 'auto_convert_comfyui_workflows' in config.`
    );
}

/**
 * Saves a converted workflow to a new file with a [CONVERTED] prefix while keeping a backup of the original file.
 *
 * @param {object} workflowObject The new workflow object with metadata.
 * @param {string} originalWorkflowFilename The original filename of the workflow.
 */
function writeConvertedWorkflowToFile(workflowObject: object, originalWorkflowFilename: string) {
    fs.writeFileSync(
        path.join(paths.workflows, `[CONVERTED] ${originalWorkflowFilename}`),
        JSON.stringify(workflowObject, null, 2),
        'utf8'
    );

    fs.renameSync(
        path.join(paths.workflows, originalWorkflowFilename),
        path.join(paths.workflows, `${originalWorkflowFilename}.bak`)
    );
}

/**
 *
 * @param {string} filename The server workflow filename.
 * @returns {Record<string, object>|WorkflowFileReadError} The workflow object, or an object with an error type if there was an error.
 */
function readServerWorkflow(filename: string): WorkflowWithMetadata | WorkflowFileReadError {
    try {
        const workflowFilePath = path.join(paths.workflows, filename);
        const fileContents = fs.readFileSync(workflowFilePath);
        const workflowObject = JSON.parse(fileContents.toString());

        return workflowObject;
    } catch (error: unknown) {
        if (error instanceof SyntaxError) {
            console.error('Error when reading workflow from file:', error);
            return { error: 'invalidJson' };
        } else if (error instanceof Error) {
            if ('code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
                return { error: 'notFound' };
            }

            console.error('Error when reading workflow from file:', error);
            return { error: 'unknown' };
        } else {
            console.error('Unknown error when reading workflow from file:', error);
            return { error: 'unknown' };
        }
    }
}

/**
 * Saves a workflow object into a file in the server workflows folder.
 *
 * @param {string} filename The filename to save the workflow to.
 * @param {object} workflowObject The workflow object to convert into a JSON and save.
 * @returns {boolean} Whether or not the workflow was successfully saved.
 */
function writeServerWorkflow(filename: string, workflowObject: object): boolean {
    try {
        fs.writeFileSync(path.join(paths.workflows, filename), JSON.stringify(workflowObject, null, 2), 'utf8');
        return true;
    } catch (error) {
        console.error('Error when saving workflow to file:', error);
        return false;
    }
}

function deleteServerWorkflow(filename: string): boolean {
    try {
        fs.unlinkSync(path.join(paths.workflows, filename));
        return true;
    } catch (error) {
        console.error('Error when deleting workflow from file:', error);
        return false;
    }
}

export {
    serverWorkflowsCheck,
    readServerWorkflow,
    writeServerWorkflow,
    deleteServerWorkflow,
    fetchedWorkflowMetadata as serverWorkflowMetadata,
};
