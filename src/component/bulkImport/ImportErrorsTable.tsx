import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Stack,
} from '@mui/material';

export interface ImportRowError {
  row: number;
  message: string;
}

interface ImportErrorsTableProps {
  successCount: number;
  failedCount: number;
  errors: ImportRowError[];
}

// §77: replaces the single success/fail toast a bulk-import dialog used
// to show with a per-row breakdown, so a partially-successful upload
// (some rows saved, some rejected) is legible instead of looking like
// either a full success or a full failure.
const ImportErrorsTable: React.FC<ImportErrorsTableProps> = ({
  successCount,
  failedCount,
  errors,
}) => {
  if (failedCount === 0) {
    return null;
  }

  return (
    <Box mt={2}>
      <Stack direction="row" spacing={1} mb={1}>
        <Chip label={`${successCount} succeeded`} color="success" size="small" />
        <Chip label={`${failedCount} failed`} color="error" size="small" />
      </Stack>
      <Typography fontSize={13} color="text.secondary" mb={1}>
        The rows below were not imported. Fix them in your file and re-upload just those rows.
      </Typography>
      <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 260 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell width={80}>Row</TableCell>
              <TableCell>Error</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {errors.map((err, idx) => (
              <TableRow key={`${err.row}-${idx}`}>
                <TableCell>{err.row}</TableCell>
                <TableCell sx={{ color: 'error.main' }}>{err.message}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default ImportErrorsTable;
