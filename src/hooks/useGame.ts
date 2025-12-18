import { useState, useRef } from "react";
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

    // Determine current player based on currentPlayer.id
    const isPlayer1 = backendResponse.currentPlayer.id === backendResponse.playerOne.id;
    const current_player = isPlayer1 ? "player1" : "player2";

    console.log("Current player:", {
        currentPlayerId: backendResponse.currentPlayer.id,
        playerOneId: backendResponse.playerOne.id,
        playerTwoId: backendResponse.playerTwo.id,
        isPlayer1,
        current_player
    });

    // Map phase to status
    let status: "in_progress" | "win" | "draw";
    if (backendResponse.phase === "FINISHED") {
        status = backendResponse.winner ? "win" : "draw";
    } else {
        status = "in_progress";
    }

    // Determine player2 type (if name is "CPU" then it's CPU)
    const player2_type = backendResponse.playerTwo.name === "CPU" ? "cpu" : "human";

    // Determine winner
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

    // Set initial state from navigation
    const setInitialState = (backendResponse: any) => {
        const mappedState = mapBackendToFrontend(backendResponse);
        setState(mappedState);
        moveStartTimeRef.current = Date.now();
    };

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
            // Get current player ID from state
            console.log("Getting playerId for current_player:", state.current_player);
            console.log("playerOne:", state.playerOne);
            console.log("playerTwo:", state.playerTwo);

            const playerId = state.current_player === "player1"
                ? state.playerOne?.id
                : state.playerTwo?.id;

            console.log("Selected playerId:", playerId);

            if (!playerId) {
                console.error("❌ Cannot determine player ID!");
                console.error("current_player:", state.current_player);
                console.error("playerOne:", state.playerOne);
                console.error("playerTwo:", state.playerTwo);
                return;
            }

            // FIXED: Pass playerId as the third parameter, not thinkingTimeMs
            const backendResponse = await api.makeMove(state.game_id, col, playerId);
            console.log("Backend returned:", backendResponse);

            const mappedState = mapBackendToFrontend(backendResponse);
            console.log("About to set state to:", mappedState);
            setState(mappedState);
            console.log("State has been set!");

            // Reset timer for next move
            if (mappedState.status === "in_progress") {
                moveStartTimeRef.current = Date.now();
            }
        } catch (error) {
            console.error("Error making move:", error);
            // Log the full error details
            if (error.response) {
                console.error("Error response data:", error.response.data);
                console.error("Error response status:", error.response.status);
            }
            throw error;
        }
    };

    return { state, makeMove, setInitialState };
}