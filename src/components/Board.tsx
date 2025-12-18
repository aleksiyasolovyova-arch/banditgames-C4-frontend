// src/components/Board.tsx
import { Box } from "@mui/material";
import Cell from "./Cell";
import { useState, useEffect } from "react";

interface Props {
    board: string[][];
    onColumnClick: (col: number) => void;
    disabled?: boolean;
}

export default function Board({ board, onColumnClick, disabled = false }: Props) {
    const [isShaking, setIsShaking] = useState(false);

    useEffect(() => {
        if (isShaking) {
            const timer = setTimeout(() => setIsShaking(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isShaking]);

    const handleColumnClick = (col: number) => {
        if (disabled) return;

        setIsShaking(true);
        onColumnClick(col);
    };

    return (
        <Box className={`enhanced-board ${isShaking ? 'board-shake' : ''}`}>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${board[0]?.length || 7}, 70px)`,
                    gap: "8px",
                }}
            >
                {board[0]?.map((_, col) => (
                    <Box
                        key={`col-${col}`}
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            cursor: disabled ? "not-allowed" : "pointer",
                            opacity: disabled ? 0.6 : 1,
                        }}
                        onClick={() => handleColumnClick(col)}
                    >
                        {board.map((row, rIdx) => (
                            <Cell key={`${rIdx}-${col}`} value={row[col]} />
                        ))}
                    </Box>
                ))}
            </Box>
        </Box>
    );
}