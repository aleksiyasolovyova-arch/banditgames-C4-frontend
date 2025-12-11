import { useState, useEffect, useRef } from "react";
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
}

export function useGame(gameId: string) {
    const [state, setState] = useState<GameState | null>(null);
    const pollingIntervalRef = useRef<number | null>(null);
    const moveStartTimeRef = useRef<number | null>(null);

    // Fetch game on mount
    useEffect(() => {
        if (!gameId) return;
        api.getGame(gameId).then(setState);
    }, [gameId]);

    // Handle polling for AI moves
    useEffect(() => {
        if (!state || !gameId) return;

        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }

        const isAITurn = state.current_player === "player2";
        const isGameInProgress = state.status === "in_progress";

        if (isAITurn && isGameInProgress) {
            console.log("Starting polling for AI move...");
            pollingIntervalRef.current = window.setInterval(async () => {
                try {
                    const updatedState = await api.getGame(gameId);
                    console.log("Polled game state:", updatedState);
                    setState(updatedState);

                    if (
                        updatedState.current_player !== "player2" ||
                        updatedState.status !== "in_progress"
                    ) {
                        console.log("AI moved! Stopping polling.");
                        if (pollingIntervalRef.current) {
                            clearInterval(pollingIntervalRef.current);
                            pollingIntervalRef.current = null;
                        }
                    }
                } catch (error) {
                    console.error("Error polling game state:", error);
                }
            }, 500);
        }

        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [state, gameId]);

    // Track when player's turn starts
    useEffect(() => {
        if (state?.current_player === "player1" && state?.status === "in_progress") {
            moveStartTimeRef.current = Date.now();
            console.log("⏱️ Player move started at:", moveStartTimeRef.current);
        }
    }, [state?.current_player, state?.status]);

    const makeMove = async (col: number) => {
        console.log("Clicked column:", col);

        const thinkingTimeMs = moveStartTimeRef.current
            ? Date.now() - moveStartTimeRef.current
            : 0;

        console.log(
            `⏱️ Player thinking time: ${thinkingTimeMs}ms (${(thinkingTimeMs / 1000).toFixed(2)}s)`
        );

        const updated = await api.makeMove(gameId, col, thinkingTimeMs);
        console.log("Backend returned:", updated);
        setState(updated);

        moveStartTimeRef.current = null;
    };

    return { state, makeMove };
}