// src/hooks/useGame.ts
import { useState, useEffect } from "react";
import { api } from "../api/api";

export function useGame(gameId: string) {
    const [state, setState] = useState<any>(null);

    useEffect(() => {
        api.getGame(gameId).then(setState);
    }, [gameId]);

    const makeMove = async (col: number) => {
        console.log("Clicked column:", col);

        const updated = await api.makeMove(gameId, col);
        console.log("Backend returned:", updated);

        setState(updated);
    };


    return { state, makeMove };
}
