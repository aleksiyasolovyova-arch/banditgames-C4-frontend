// src/api/mlApi.ts
import axios from "axios";

const ML_API_URL = "http://localhost:8001";

interface BoardState {
    board: number[][];
    current_player: number;
    legal_moves: number[];
}

interface MoveSuggestion {
    move: number;
    confidence: number;
}

interface PredictionResponse {
    predicted_move: number;
    confidence: number;
    top_k_moves: MoveSuggestion[];
    inference_time_ms?: number;
    model_version: string;
}
    interface WinProbResponse {
  win: number;
  draw: number;
  loss: number;
  model_version: string;
}
/**
 * Convert frontend board format to ML API format
 * Handles multiple representations:
 * - Player 1: 'X', '1', or 1
 * - Player 2: 'O', '2', or 2
 * - Empty: '', '.', null, undefined, 0, '0'
 */
function convertBoardToNumeric(board: any[][]): number[][] {
    console.log(' [mlApi] Converting board...');
    console.log(' [mlApi] First row before conversion:', board[0]);

    const numericBoard = board.map(row =>
        row.map(cell => {
            // Player 1: 'X' or '1' or 1
            if (cell === 'X' || cell === '1' || cell === 1) {
                return 1;
            }

            // Player 2: 'O' or '2' or 2
            if (cell === 'O' || cell === '2' || cell === 2) {
                return 2;
            }

            // Empty: everything else (including '.', '', null, undefined, 0)
            return 0;
        })
    );

    console.log(' [mlApi] First row after conversion:', numericBoard[0]);
    console.log(' [mlApi] Board dimensions:', `${numericBoard.length}x${numericBoard[0]?.length}`);

    return numericBoard;
}



/**
 * Get legal moves from board state
 * Checks the top row for empty cells
 */
function getLegalMoves(board: any[][]): number[] {
    console.log(' [mlApi] Calculating legal moves...');
    console.log(' [mlApi] Top row:', board[0]);

    const legalMoves: number[] = [];

    if (!board || board.length === 0 || !board[0]) {
        console.error(' [mlApi] Invalid board structure!');
        return [];
    }

    // Check top row for empty cells
    for (let col = 0; col < board[0].length; col++) {
        const topCell = board[0][col];

        // Check if cell is empty (handle multiple representations)
        const isEmpty = (
            topCell === '' ||
            topCell === '.' ||
            topCell === null ||
            topCell === undefined ||
            topCell === 0 ||
            topCell === '0'
        );

        if (isEmpty) {
            legalMoves.push(col);
        }
    }

    console.log(' [mlApi] Legal moves:', legalMoves);

    if (legalMoves.length === 0) {
        console.warn(' [mlApi] No legal moves found! Board might be full.');
    }

    return legalMoves;
}

export const mlApi = {
    /**
     * Get move suggestion from ML model
     *
     * @param board - Frontend board state (any[][])
     * @param currentPlayer - 'player1' or 'player2'
     * @param topK - Number of top moves to return (default: 3)
     * @returns Prediction with suggested moves
     */
    async getSuggestedMove(
        board: any[][],
        currentPlayer: 'player1' | 'player2',
        topK: number = 3
    ): Promise<PredictionResponse> {
        console.log(' [mlApi.getSuggestedMove] START');
        console.log(' [mlApi] Parameters:', {
            currentPlayer,
            topK,
            boardDimensions: `${board.length}x${board[0]?.length}`,
            firstRowSample: board[0]
        });

        try {
            // Convert board to numeric format
            const numericBoard = convertBoardToNumeric(board);

            // Get legal moves
            const legalMoves = getLegalMoves(board);

            // Validate we have legal moves
            if (legalMoves.length === 0) {
                const error = 'No legal moves available - board might be full';
                console.error(' [mlApi]', error);
                throw new Error(error);
            }

            // Current player as number
            const playerNum = currentPlayer === 'player1' ? 1 : 2;

            const payload = {
                board_state: {
                    board: numericBoard,
                    current_player: playerNum,
                    legal_moves: legalMoves
                },
                top_k: topK
            };

            console.log(' [mlApi] Sending POST request to:', `${ML_API_URL}/predict`);
            console.log(' [mlApi] Payload summary:', {
                board_sample: numericBoard[0],
                player: playerNum,
                legalMoves: legalMoves,
                topK: topK
            });

            const response = await axios.post<PredictionResponse>(
                `${ML_API_URL}/predict`,
                payload,
                {
                    timeout: 5000,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            console.log(' [mlApi] Response received!');
            console.log(' [mlApi] Response data:', response.data);
            console.log(' [mlApi] Predicted move:', response.data.predicted_move);
            console.log(' [mlApi] Confidence:', response.data.confidence);
            console.log(' [mlApi] Model version:', response.data.model_version);

            return response.data;

        } catch (error: any) {
            console.error(' [mlApi.getSuggestedMove] ERROR');

            if (error.response) {
                // Server responded with error
                console.error('️ [mlApi] Server error response:', {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                });
            } else if (error.request) {
                // Request sent but no response
                console.error('[mlApi] No response received:', {
                    message: 'Request was sent but no response was received',
                    url: ML_API_URL
                });
            } else {
                // Error setting up request
                console.error(' [mlApi] Request setup error:', error.message);
            }

            throw error;
        }
    },

async getWinProbabilityExample(
  board: any[][],
  moveIndex: number
): Promise<WinProbResponse> {
  const numericBoard = board.map(row =>
    row.map(cell =>
      cell === 'X' || cell === 1 ? 1 :
      cell === 'O' || cell === 2 ? 2 : 0
    )
  );

  const payload = {
    board_before: numericBoard,
    policy: [0.1, 0.1, 0.15, 0.25, 0.15, 0.15, 0.1],   // hard-coded
    q_values: [0.0, 0.1, 0.05, 0.2, 0.1, 0.05, 0.0], // hard-coded
    move_index: moveIndex
  };

  const res = await axios.post(
    `${ML_API_URL}/predict/win-probability`,
    payload,
    { timeout: 5000 }
  );

  return res.data;
},


    /**
     * Check if ML API is available and has a model loaded
     *
     * @returns true if API is healthy and model is loaded, false otherwise
     */
async checkHealth(): Promise<boolean> {
    try {
        const response = await axios.get(`${ML_API_URL}/health`, {
            timeout: 2000
        });

        return response.data.policy_loaded === true;
    } catch {
        return false;
    }
}
};
