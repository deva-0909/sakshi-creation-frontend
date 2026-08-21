import React, { useEffect, useState } from 'react';
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
  CircularProgress,
  Collapse,
  IconButton,
} from '@mui/material';
import { AiOutlineDown, AiOutlineUp } from 'react-icons/ai';
import { toast } from 'react-toastify';
import CustomDialog from '@/component/customdialog';
import { importHistoryService, ImportLogEntry } from '@/services/importHistory.service';

interface ImportHistoryDialogProps {
  open: boolean;
  onClose: () => void;
  module: string;
  title?: string;
}

// §77: one shared history view for all bulk-import modules, backed by the
// shared import_logs table / GET /api/import-history/:module endpoint —
// avoids building a near-identical page per module.
const ImportHistoryDialog: React.FC<ImportHistoryDialogProps> = ({
  open,
  onClose,
  module,
  title = 'Import History',
}) => {
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<ImportLogEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    importHistoryService
      .getImportHistory(module)
      .then((res) => setEntries(res.data || []))
      .catch((err: any) => toast.error(err.message || 'Failed to load import history'))
      .finally(() => setLoading(false));
  }, [open, module]);

  return (
    <CustomDialog open={open} maxWidth="md" onClose={onClose} title={title}>
      <Box sx={{ background: '#fff', borderRadius: 2, p: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress size={28} />
          </Box>
        ) : entries.length === 0 ? (
          <Typography color="text.secondary" textAlign="center" py={4}>
            No bulk imports have been run for this module yet.
          </Typography>
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 420 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell width={40} />
                  <TableCell>File</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Imported By</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Succeeded</TableCell>
                  <TableCell align="right">Failed</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry) => {
                  const isExpanded = expandedId === entry._id;
                  const importedByName = entry.importedBy
                    ? `${entry.importedBy.firstName || ''} ${entry.importedBy.lastName || ''}`.trim() ||
                      entry.importedBy.email
                    : '—';
                  return (
                    <React.Fragment key={entry._id}>
                      <TableRow>
                        <TableCell>
                          {entry.errors && entry.errors.length > 0 && (
                            <IconButton
                              size="small"
                              onClick={() => setExpandedId(isExpanded ? null : entry._id)}
                            >
                              {isExpanded ? <AiOutlineUp /> : <AiOutlineDown />}
                            </IconButton>
                          )}
                        </TableCell>
                        <TableCell>{entry.fileName || '—'}</TableCell>
                        <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                        <TableCell>{importedByName}</TableCell>
                        <TableCell align="right">{entry.totalRows}</TableCell>
                        <TableCell align="right">
                          <Chip label={entry.successCount} color="success" size="small" />
                        </TableCell>
                        <TableCell align="right">
                          {entry.failedCount > 0 ? (
                            <Chip label={entry.failedCount} color="error" size="small" />
                          ) : (
                            entry.failedCount
                          )}
                        </TableCell>
                      </TableRow>
                      {entry.errors && entry.errors.length > 0 && (
                        <TableRow>
                          <TableCell colSpan={7} sx={{ p: 0, borderBottom: isExpanded ? undefined : 'none' }}>
                            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 2, backgroundColor: '#fafafa' }}>
                                {entry.errors.map((err, idx) => (
                                  <Typography key={idx} fontSize={13} color="error.main">
                                    Row {err.row}: {err.message}
                                  </Typography>
                                ))}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </CustomDialog>
  );
};

export default ImportHistoryDialog;
