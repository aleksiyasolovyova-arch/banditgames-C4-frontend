// src/hooks/useGame.ts (

import { useState, useEffect, useRef } from "react";
import { api } from "../api/api";

// Define the GameState type
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

    // Initial fetch when game ID changes
    useEffect(() => {
        if (!gameId) return;
        api.getGame(gameId).then(setState);
    }, [gameId]);

    // Polling effect - runs when state changes
    useEffect(() => {
        if (!state || !gameId) return;

        // Clear any existing polling interval
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }

        // Only poll if:
        // 1. It's player2's turn (AI)
        // 2. Game is still in progress
        const isAITurn = state.current_player === "player2";
        const isGameInProgress = state.status === "in_progress";

        if (isAITurn && isGameInProgress) {
            console.log("Starting polling for AI move...");

            pollingIntervalRef.current = window.setInterval(async () => {
                try {
                    const updatedState = await api.getGame(gameId);
                    console.log("Polled game state:", updatedState);

                    // Update state with new game data
                    setState(updatedState);

                    // Stop polling if it's no longer AI's turn or game ended
                    if (updatedState.current_player !== "player2" ||
                        updatedState.status !== "in_progress") {
                        console.log("AI moved! Stopping polling.");
                        if (pollingIntervalRef.current) {
                            clearInterval(pollingIntervalRef.current);
                            pollingIntervalRef.current = null;
                        }
                    }
                } catch (error) {
                    console.error("Error polling game state:", error);
                }
            }, 500); // Poll every 500ms
        }

        // Cleanup function
        return () => {
            if (pollingIntervalRef.current) {
                clearInterval(pollingIntervalRef.current);
                pollingIntervalRef.current = null;
            }
        };
    }, [state, gameId]);

    const makeMove = async (col: number) => {
        console.log("Clicked column:", col);
        const updated = await api.makeMove(gameId, col);
        console.log("Backend returned:", updated);
        setState(updated);
        // Polling will automatically start if it's AI's turn after this move
    };

    return { state, makeMove };
}
