
import axios from "axios";
const API_URL = "http://localhost:8000";

interface GameConfig {
    player2_type?: "cpu" | "human";
    rows?: number;
    cols?: number;
}

// Backend expects this format
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

// Hardcoded player UUIDs for testing (will be replaced with Keycloak IDs later)
const HARDCODED_PLAYER1_ID = "550e8400-e29b-41d4-a716-446655440001";
const HARDCODED_PLAYER2_ID = "550e8400-e29b-41d4-a716-446655440002";

export const api = {
    createGame: (config: GameConfig) => {
        const payload: CreateGameRequest = {
            playerOne: {
                id: HARDCODED_PLAYER1_ID,
                name: "Player 1"
            },
            playerTwo: {
                id: HARDCODED_PLAYER2_ID,
                name: "Player 2"
            },
            rows: config.rows || 6,
            cols: config.cols || 7
        };

        return axios.post(`${API_URL}/games`, payload).then((r) => r.data);
    },

    makeMove: (id: string, column: number, player?: string) => {
        // Backend expects: { playerId: string, column: number }
        return axios
            .post(`${API_URL}/games/${id}/moves`, {
                playerId: player,
                column,
            })
            .then((r) => r.data);
    },

};