import fs from 'fs/promises';
import path from 'path';

// Define the data directory relative to the project root
// process.cwd() is expected to be the root of the project (where package.json is)
const DATA_DIR = path.join(process.cwd(), 'server/data');
const CHAT_HISTORY_FILE = path.join(DATA_DIR, 'chat_history.json');

export type Message = {
    role: "system" | "user" | "assistant";
    content: string;
};

// Ensure data directory exists
async function ensureDataDir() {
    try {
        await fs.access(DATA_DIR);
    } catch {
        // Directory doesn't exist, create it
        await fs.mkdir(DATA_DIR, { recursive: true });
    }
}

// Get chat history for a specific stock or global
export async function getChatHistory(stockCode: string = 'default'): Promise<Message[]> {
    try {
        await ensureDataDir();
        try {
            const data = await fs.readFile(CHAT_HISTORY_FILE, 'utf-8');
            const historyMap = JSON.parse(data);
            return historyMap[stockCode] || [];
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    } catch (error) {
        console.error('Failed to read chat history:', error);
        return [];
    }
}

// Save chat history for a specific stock or global
export async function saveChatHistory(messages: Message[], stockCode: string = 'default'): Promise<void> {
    try {
        await ensureDataDir();

        let historyMap: Record<string, Message[]> = {};
        try {
            const data = await fs.readFile(CHAT_HISTORY_FILE, 'utf-8');
            historyMap = JSON.parse(data);
        } catch (error: any) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }

        historyMap[stockCode] = messages;

        await fs.writeFile(CHAT_HISTORY_FILE, JSON.stringify(historyMap, null, 2), 'utf-8');
    } catch (error) {
        console.error('Failed to save chat history:', error);
        throw error;
    }
}

// Clear chat history
export async function clearChatHistory(stockCode?: string): Promise<void> {
    try {
        if (stockCode) {
            let historyMap: Record<string, Message[]> = {};
            try {
                const data = await fs.readFile(CHAT_HISTORY_FILE, 'utf-8');
                historyMap = JSON.parse(data);
            } catch (error: any) {
                if (error.code === 'ENOENT') return;
                throw error;
            }
            delete historyMap[stockCode];
            await fs.writeFile(CHAT_HISTORY_FILE, JSON.stringify(historyMap, null, 2), 'utf-8');
        } else {
            await fs.unlink(CHAT_HISTORY_FILE);
        }
    } catch (error: any) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
}
