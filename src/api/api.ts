// src/api/api.ts
import axios from "axios";

const API_URL = "http://connect4_backend:8000";

export const api = {
    createGame: (config: any) =>
        axios.post(`${API_URL}/games`, config).then(r => r.data),

    getGame: (id: string) =>
        axios.get(`${API_URL}/games/${id}`).then(r => r.data),

    getHistory: (id: string) =>
        axios.get(`${API_URL}/games/${id}/history`).then(r => r.data),

    makeMove: (id: string, column: number, player?: string) =>
        axios
            .post(`${API_URL}/games/${id}/moves`, { column, player })
            .then(r => r.data),

    cpuMove: (id: string) =>
        axios.post(`${API_URL}/games/${id}/moves/auto`).then(r => r.data),
};
