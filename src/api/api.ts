import axios from "axios";
const API_URL = "http://localhost:8000";

interface GameConfig {
    player2_type?: "cpu" | "human";
    rows?: number;
    cols?: number;
}

interface CreateGameRequest {
    playerOne: {
        id: string;
        name: string;
    };
    playerTwo: {
        id: string;
        name: string;
    };
    rows?: number;
    cols?: number;
}

const HARDCODED_PLAYER1_ID = "550e8400-e29b-41d4-a716-446655440001";
const HARDCODED_PLAYER2_ID = "550e8400-e29b-41d4-a716-446655440002";
const AI_PLAYER_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

export const api = {
    createGame: (config: GameConfig) => {
        const isVsCpu = config.player2_type === "cpu";

        const payload: CreateGameRequest = {
            playerOne: {
                id: HARDCODED_PLAYER1_ID,
                name: "Player 1"
            },
            playerTwo: {
                id: isVsCpu ? AI_PLAYER_ID : HARDCODED_PLAYER2_ID,
                name: isVsCpu ? "CPU" : "Player 2"
            },
            rows: config.rows || 6,
            cols: config.cols || 7
        };

        console.log("Creating game with payload:", payload);

        return axios.post(`${API_URL}/games`, payload).then((r) => r.data);
    },

    makeMove: (id: string, column: number, player?: string) => {
        return axios
            .post(`${API_URL}/games/${id}/moves`, {
                playerId: player,
                column,
            })
            .then((r) => r.data);
    },

    // ========================================
    // ADD THIS NEW METHOD
    // ========================================
    getGame: (id: string) => {
        return axios.get(`${API_URL}/games/${id}`).then((r) => r.data);
    },
};
