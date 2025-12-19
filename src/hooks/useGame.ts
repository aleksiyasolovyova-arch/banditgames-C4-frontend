import { useState, useRef, useEffect } from "react";
import { api } from "../api/api";

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
    const moveStartTimeRef = useRef<number | null>(null);
    const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

    // Set initial state from navigation
    const setInitialState = (backendResponse: any) => {
        const mappedState = mapBackendToFrontend(backendResponse);
        setState(mappedState);
        moveStartTimeRef.current = Date.now();
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
                    console.log("📡 Polling game state...");
                    const backendResponse = await api.getGame(gameId);
                    const mappedState = mapBackendToFrontend(backendResponse);

                    // Check if turn changed (AI moved)
                    if (mappedState.current_player !== state.current_player ||
                        mappedState.moveCount !== state.moveCount) {
                        console.log("✅ AI move detected! Updating state...");
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

        console.log(`⏱️ Player thinking time: ${thinkingTimeMs}ms (${(thinkingTimeMs / 1000).toFixed(2)}s)`);

        try {
            const playerId = state.current_player === "player1"
                ? state.playerOne?.id
                : state.playerTwo?.id;

            if (!playerId) {
                console.error("❌ Cannot determine player ID!");
                return;
            }

            const backendResponse = await api.makeMove(state.game_id, col, playerId);
            console.log("Backend returned:", backendResponse);

            const mappedState = mapBackendToFrontend(backendResponse);
            setState(mappedState);

            // Reset timer for next move
            if (mappedState.status === "in_progress") {
                moveStartTimeRef.current = Date.now();
            }
        } catch (error) {
            console.error("Error making move:", error);
            if (error.response) {
                console.error("Error response data:", error.response.data);
                console.error("Error response status:", error.response.status);
            }
            throw error;
        }
    };

    return { state, makeMove, setInitialState };
}