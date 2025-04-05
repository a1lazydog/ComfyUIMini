async function getQueueCount(): Promise<number> {
    const queue = await fetch('/queue_count');
    return queue.json();
}

export default getQueueCount;