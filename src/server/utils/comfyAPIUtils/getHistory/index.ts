import { HistoryResponse } from '@shared/types/History';
import { comfyUIAxios } from '../comfyUIAxios';

async function getHistory(promptId?: string): Promise<HistoryResponse> {
    const url = promptId ? `/history/${promptId}` : "/history?max_items=20";
    const response = await comfyUIAxios.get(url);

    return response.data;
}

export default getHistory;
