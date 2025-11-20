// src/components/Cell.tsx (updated)
import { Box } from "@mui/material";

interface Props {
    value: string;
}

export default function Cell({ value }: Props) {
    const cellClass = `enhanced-cell ${value === 'X' ? 'player1' : value === 'O' ? 'player2' : ''}`;

    return (
        <Box className={cellClass} />
    );
}