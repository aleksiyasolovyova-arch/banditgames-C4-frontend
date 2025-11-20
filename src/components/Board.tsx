// src/components/Board.tsx (updated)
import { Box } from "@mui/material";
import Cell from "./Cell";
import { useState, useEffect } from "react";

interface Props {
    board: string[][];
    onColumnClick: (col: number) => void;
}

export default function Board({ board, onColumnClick }: Props) {
    const [isShaking, setIsShaking] = useState(false);

    useEffect(() => {
        if (isShaking) {
            const timer = setTimeout(() => setIsShaking(false), 500);
            return () => clearTimeout(timer);
        }
    }, [isShaking]);

    const handleColumnClick = (col: number) => {
        setIsShaking(true);
        onColumnClick(col);
    };

    return (
        <Box className={`enhanced-board ${isShaking ? 'board-shake' : ''}`}>
            <Box
                sx={{
                    display: "grid",
                    gridTemplateColumns: `repeat(${board[0].length}, 70px)`,
                    gap: "8px",
                }}
            >
                {board[0].map((_, col) => (
                    <Box
                        key={`col-${col}`}
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            cursor: "pointer",
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