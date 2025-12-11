import axios from "axios";

const API_URL = "http://localhost:8000";

interface GameConfig {
    player1_type?: string;
    player2_type?: string;
    player2_skill_level?: string;
    rows?: number;
    cols?: number;
}

export const api = {
    createGame: (config: GameConfig) =>
        axios.post(`${API_URL}/games`, config).then((r) => r.data),

    getGame: (id: string) =>
        axios.get(`${API_URL}/games/${id}`).then((r) => r.data),

    getHistory: (id: string) =>
        axios.get(`${API_URL}/games/${id}/history`).then((r) => r.data),

    makeMove: (id: string, column: number, thinkingTimeMs?: number, player?: string) =>
        axios
            .post(`${API_URL}/games/${id}/moves`, {
                column,
                player,
                thinking_time_ms: thinkingTimeMs ?? 0,
            })
            .then((r) => r.data),

    cpuMove: (id: string) =>
        axios.post(`${API_URL}/games/${id}/moves/auto`).then((r) => r.data),
};
