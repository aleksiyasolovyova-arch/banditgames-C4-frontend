import { useState, useRef, useEffect } from "react";
import { api } from "../api/api";
import { mlApi } from "../api/mlApi";

interface GameState {
    game_id: string;
    board: string[][];
    current_player: "player1" | "player2";
    status: "in_progress" | "win" | "draw";
    winner: string | null;
    config: {
        player2_type: "cpu" | "human";
    };
    created_at?: string;
    playerOne?: { id: string; name: string };
    playerTwo?: { id: string; name: string };
    moveCount?: number;
}

interface MoveSuggestion {
    move: number;
    confidence: number;
}

interface MLSuggestionState {
    lastMove: number | null;
    suggestedMove: number | null;
    topMoves: MoveSuggestion[];
    isLoading: boolean;
    playerColor: 'player1' | 'player2' | null;
}

// Map backend response to frontend state
function mapBackendToFrontend(backendResponse: any): GameState {
    console.log("Mapping backend response:", JSON.stringify(backendResponse, null, 2));

    const isPlayer1 = backendResponse.currentPlayer.id === backendResponse.playerOne.id;
    const current_player = isPlayer1 ? "player1" : "player2";

    let status: "in_progress" | "win" | "draw";
    if (backendResponse.phase === "FINISHED") {
        status = backendResponse.winner ? "win" : "draw";
    } else {
        status = "in_progress";
    }

    const player2_type = backendResponse.playerTwo.name === "CPU" ? "cpu" : "human";

    let winner: string | null = null;
    if (backendResponse.winner) {
        winner = backendResponse.winner.id === backendResponse.playerOne.id ? "player1" : "player2";
    }

    const mappedState = {
        game_id: backendResponse.id,
        board: backendResponse.board.grid,
        current_player,
        status,
        winner,
        config: {
            player2_type
        },
        created_at: backendResponse.createdAt,
        playerOne: backendResponse.playerOne,
        playerTwo: backendResponse.playerTwo,
        moveCount: backendResponse.moveCount
    };

    console.log("Mapped state:", mappedState);
    return mappedState;
}

export function useGame(gameId: string | null) {
    const [state, setState] = useState<GameState | null>(null);
    const [mlSuggestion, setMlSuggestion] = useState<MLSuggestionState>({
        lastMove: null,
        suggestedMove: null,
        topMoves: [],
        isLoading: false,
        playerColor: null
    });
    const [mlAvailable, setMlAvailable] = useState<boolean>(false);

    const moveStartTimeRef = useRef<number | null>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // ========================================
    // ML API HEALTH CHECK ON MOUNT
    // ========================================
    useEffect(() => {
        console.log('🔍 [useGame] Checking ML API health on mount...');

        mlApi.checkHealth()
            .then(available => {
                console.log(' [useGame] Health check completed');
                console.log('[useGame] ML API available:', available);

                setMlAvailable(available);

                if (available) {
                    console.log(' ML API is available - suggestions enabled');
                } else {
                    console.warn(' ML API is not available - move suggestions disabled');
                }
            })
            .catch(err => {
                console.error(' [useGame] Health check failed with error:', err);
                setMlAvailable(false);
            });
    }, []);

    // Set initial state from navigation
    const setInitialState = (backendResponse: any) => {
        const mappedState = mapBackendToFrontend(backendResponse);
        setState(mappedState);
        moveStartTimeRef.current = Date.now();
    };

    // ========================================
    // ML SUGGESTION: Get suggestion after human move
    // ========================================
    const getSuggestionForMove = async (
        currentBoard: string[][],
        player: 'player1' | 'player2',
        columnPlayed: number
    ) => {
        console.log(' [getSuggestionForMove] Called with:', {
            player,
            columnPlayed,
            mlAvailable,
            boardSample: currentBoard[0],
            bottomRow: currentBoard[5]
        });

        let pieceCount = 0;
        for (let row of currentBoard) {
            for (let cell of row) {
                if (cell !== '.' && cell !== '' && cell !== null && cell !== 0 && cell !== '0') {
                    pieceCount++;
                }
            }
        }
        console.log(' [getSuggestionForMove] Pieces on board:', pieceCount);

        if (!mlAvailable) {
            console.log('️ [getSuggestionForMove] ML API not available, skipping suggestion');
            return;
        }

        setMlSuggestion(prev => ({
            ...prev,
            isLoading: true,
            lastMove: columnPlayed,
            playerColor: player
        }));

        try {
            console.log(' [getSuggestionForMove] Calling mlApi.getSuggestedMove...');
            const prediction = await mlApi.getSuggestedMove(currentBoard, player, 3);

            console.log(' [getSuggestionForMove] Prediction received:', prediction);

            setMlSuggestion({
                lastMove: columnPlayed,
                suggestedMove: prediction.predicted_move,
                topMoves: prediction.top_k_moves,
                isLoading: false,
                playerColor: player
            });

            console.log(' ML suggestion set:', {
                yourMove: columnPlayed,
                aiSuggested: prediction.predicted_move,
                topMoves: prediction.top_k_moves
            });
        } catch (error) {
            console.error(' [getSuggestionForMove] Failed to get ML suggestion:', error);
            setMlSuggestion(prev => ({ ...prev, isLoading: false }));
        }
    };

    // ========================================
    // POLLING: Check for AI moves
    // ========================================
    useEffect(() => {
        if (!state || !gameId) return;

        // Only poll if:
        // 1. Game is vs CPU
        // 2. It's CPU's turn
        // 3. Game is in progress
        const shouldPoll =
            state.config.player2_type === "cpu" &&
            state.current_player === "player2" &&
            state.status === "in_progress";

        if (shouldPoll) {
            console.log("🔄 Starting to poll for AI move...");

            // Poll every 500ms
            pollingIntervalRef.current = setInterval(async () => {
                try {
                    console.log(" Polling game state...");
                    const backendResponse = await api.getGame(gameId);
                    const mappedState = mapBackendToFrontend(backendResponse);

                    // Check if turn changed (AI moved)
                    if (mappedState.current_player !== state.current_player ||
                        mappedState.moveCount !== state.moveCount) {
                        console.log(" AI move detected! Updating state...");
                        setState(mappedState);
                        moveStartTimeRef.current = Date.now();

                        // Stop polling after AI moves
                        if (pollingIntervalRef.current) {
                            clearInterval(pollingIntervalRef.current);
                            pollingIntervalRef.current = null;
                        }
                    }
                } catch (error) {
                    console.error("Error polling game state:", error);
                }
            }, 500); // Poll every 500ms

            return () => {
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                    pollingIntervalRef.current = null;
                }
            };
        }
    }, [state, gameId]);

    const makeMove = async (col: number) => {
        if (!state) {
            console.error("Cannot make move: no game state");
            return;
        }

        console.log("Making move in column:", col);

        const thinkingTimeMs = moveStartTimeRef.current
            ? Date.now() - moveStartTimeRef.current
            : 0;

        console.log(` Player thinking time: ${thinkingTimeMs}ms (${(thinkingTimeMs / 1000).toFixed(2)}s)`);

        // ========================================
        // SAVE INFO ABOUT WHO IS MAKING THE MOVE
        // ========================================
        const playerMakingMove = state.current_player;
        const columnPlayed = col;
        const isHumanMove = (
            (playerMakingMove === 'player1') ||
            (playerMakingMove === 'player2' && state.config.player2_type === 'human')
        );

        console.log('🔍 [makeMove] Move details:', {
            column: col,
            playerMakingMove,
            isHumanMove,
            player2Type: state.config.player2_type,
            mlAvailable
        });

        try {
            const playerId = state.current_player === "player1"
                ? state.playerOne?.id
                : state.playerTwo?.id;

            if (!playerId) {
                console.error(" Cannot determine player ID!");
                return;
            }

            const backendResponse = await api.makeMove(state.game_id, col, playerId);
            console.log("Backend returned:", backendResponse);

            const boardFromBackend = backendResponse.board.grid;

            console.log(' [makeMove] Board from backend (bottom row):', boardFromBackend[5]);

            const mappedState = mapBackendToFrontend(backendResponse);
            setState(mappedState);

            // ========================================
            // GET ML SUGGESTION FOR HUMAN MOVES
            // ========================================
            console.log(' [makeMove] Checking if should get ML suggestion:', {
                isHumanMove,
                newStatus: mappedState.status,
                mlAvailable,
                playerMakingMove
            });

            if (isHumanMove && mappedState.status === "in_progress") {
                console.log(' [makeMove] Conditions met! Calling getSuggestionForMove...');

                // Use boardFromBackend (extracted directly from API response)
                // This guarantees we're using the updated board with the piece just placed
                await getSuggestionForMove(
                    boardFromBackend,  // ← Direct from backend, bypasses any state issues!
                    playerMakingMove,
                    columnPlayed
                );
            } else {
                console.log(' [makeMove] NOT getting ML suggestion because:', {
                    isHumanMove: isHumanMove ? 'YES' : 'NO (not human player)',
                    status: mappedState.status === "in_progress" ? 'in_progress' : mappedState.status,
                    mlAvailable: mlAvailable ? 'YES' : 'NO (ML API not available)'
                });
            }

            // Reset timer for next move
            if (mappedState.status === "in_progress") {
                moveStartTimeRef.current = Date.now();
            }
        } catch (error) {
            console.error("Error making move:", error);
            if ((error as any).response) {
                console.error("Error response data:", (error as any).response.data);
                console.error("Error response status:", (error as any).response.status);
            }
            throw error;
        }
    };

    return {
        state,
        makeMove,
        setInitialState,
        mlSuggestion,
        mlAvailable
    };
}