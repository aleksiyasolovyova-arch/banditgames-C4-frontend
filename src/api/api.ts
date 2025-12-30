import axios from "axios";

const API_URL = "http://localhost:8000";

interface CreateGameRequest {
    gameId: string;
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

export const api = {
    /**
     * Create a game with specific gameId and player IDs
     */
    createGame: (gameId: string, player1Id: string, player2Id: string) => {
        const payload: CreateGameRequest = {
            gameId: gameId,
            playerOne: {
                id: player1Id,
                name: "Player 1"
            },
            playerTwo: {
                id: player2Id,
                name: "Player 2"
            },
            rows: 6,
            cols: 7
        };

        console.log("Creating game with payload:", payload);
        return axios.post(`${API_URL}/games`, payload).then((r) => r.data);
    },

    /**
     * Make a move in the game
     */
    makeMove: (gameId: string, column: number, playerId: string) => {
        return axios.post(`${API_URL}/games/${gameId}/moves`, {
            playerId,
            column,
        }).then((r) => r.data);
    },

    /**
     * Get game state
     */
    getGame: (gameId: string) => {
        return axios.get(`${API_URL}/games/${gameId}`).then((r) => r.data);
    },
};