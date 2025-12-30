import { useState, useRef, useEffect } from "react";
import { api } from "../api/api";
import { mlApi } from "../api/mlApi";

interface GameState {
    game_id: string;
    board: string[][];
    current_player: "player1" | "player2";
    status: "in_progress" | "win" | "draw";
    winner: string | null;
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
    const [loading, setLoading] = useState<boolean>(true);
    const [gameExists, setGameExists] = useState<boolean>(false);

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

    // ========================================
    // FETCH GAME STATE
    // ========================================
    const fetchGame = async () => {
        if (!gameId) {
            setLoading(false);
            setGameExists(false);
            return;
        }

        try {
            setLoading(true);
            const data = await api.getGame(gameId);
            setState(mapBackendToFrontend(data));
            setGameExists(true);
            moveStartTimeRef.current = Date.now();
        } catch (error: any) {
            if (error.response && error.response.status === 404) {
                console.log("Game not found - needs to be created");
                setGameExists(false);
                setState(null);
            } else {
                console.error("Error fetching game:", error);
            }
        } finally {
            setLoading(false);
        }
    };

    // INITIAL FETCH AND POLLING
    useEffect(() => {
        fetchGame();

        // Poll for game updates every 2 seconds
        const interval = setInterval(() => {
            if (gameExists && gameId) {
                api.getGame(gameId)
                    .then(data => {
                        const newState = mapBackendToFrontend(data);
                        // Only update if move count changed (prevents jitter)
                        setState(prev => {
                            if (!prev || newState.moveCount !== prev.moveCount || newState.status !== prev.status) {
                                return newState;
                            }
                            return prev;
                        });
                    })
                    .catch(err => console.error("Polling error:", err));
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [gameId, gameExists]);

    // CREATE GAME FUNCTION
    const createGame = async (gameId: string, player1Id: string, player2Id: string) => {
        console.log("Creating game:", { gameId, player1Id, player2Id });

        try {
            const backendResponse = await api.createGame(gameId, player1Id, player2Id);
            console.log("Game created:", backendResponse);

            const mappedState = mapBackendToFrontend(backendResponse);
            setState(mappedState);
            setGameExists(true);
            moveStartTimeRef.current = Date.now();
        } catch (error) {
            console.error("Error creating game:", error);
            throw error;
        }
    };

    // ========================================
    // ML SUGGESTION: Get suggestion after ANY move
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
        console.log('📊 [getSuggestionForMove] Pieces on board:', pieceCount);

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


    // MAKE MOVE
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

        // SAVE INFO ABOUT WHO IS MAKING THE MOVE
        const playerMakingMove = state.current_player;
        const columnPlayed = col;

        console.log(' [makeMove] Move details:', {
            column: col,
            playerMakingMove,
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


            // GET ML SUGGESTION FOR ALL MOVES

            console.log(' [makeMove] Checking if should get ML suggestion:', {
                newStatus: mappedState.status,
                mlAvailable,
                playerMakingMove
            });

            if (mappedState.status === "in_progress" && mlAvailable) {
                console.log(' [makeMove] Getting ML suggestion...');

                // Use boardFromBackend (direct from API response)
                await getSuggestionForMove(
                    boardFromBackend,
                    playerMakingMove,
                    columnPlayed
                );
            } else {
                console.log(' [makeMove] NOT getting ML suggestion because:', {
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
        loading,
        gameExists,
        createGame,
        makeMove,
        mlSuggestion,
        mlAvailable
    };
}