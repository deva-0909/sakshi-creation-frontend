"use client";

import React, { useState, useEffect } from 'react';
import { Box, Button, IconButton, Stack, Typography } from '@mui/material';
import ThemeInput from '@/component/common_component/themeinput';
import ThemeSelect from '@/component/common_component/themeselect';
import ThemeChip from '@/component/common_component/themechip';
import ThemeButton from '@/component/common_component/themebutton';
import { MdTurnLeft } from 'react-icons/md';
import CustomDialog from '@/component/customdialog';
import AssignTaskDialog from '@/component/assigntaskdailog';
import AddOrderDialog from '@/component/allorderdailog';
import { useSelector } from 'react-redux';
import { useAppDispatch } from '@/store';
import { useRouter } from 'next/router';
import {
  getAccountMasterByIdThunk,
  getAllAccountMastersThunk,
} from '@/store/slices/accountMasterSlice';
import {
  getAllAssignTasksThunk,
  createAssignTaskThunk,
  updateAssignTaskThunk,
} from '@/store/slices/assignTaskSlice';
import { getAllLeadsThunk } from '@/store/slices/leadSlice';
import { getStaffListLiteThunk } from '@/store/slices/staffSlice';
import { getAllOpportunitiesThunk } from '@/store/slices/opportunitySlice';
import { format } from 'date-fns';
import Loader from '@/component/common_component/loader';
import PartyThreeSixtyPanel from '@/component/partythreesixtypanel';

interface Task {
  _id: string;
  companyName: string;
  partyName: string;
  date: string;
  time: string;
  visitDate?: string;
  visitTime?: string;
  reasonForVisit: string;
  status: string;
  assignTo: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  feedback?: string;
  createdAt: string;
  updatedAt: string;
  accountDetails: {
    _id: string;
    companyName: string;
    partyName: string;
    address: {
      unitNo: string;
      marketName: string;
      streetAddress: string;
      area: string;
      pincode: string;
    };
    contactPerson: string;
    personMobileNo: string;
  };
}

interface Lead {
  _id: string;
  companyName: string;
  partyName: string;
  mobile: string;
  status: string;
  reason: string;
  remark: string;
  callFeedback?: string;
  assignedTo: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  date: string;
  time: string;
  accountDetails: {
    _id: string;
    companyName: string;
    partyName: string;
    address: {
      unitNo: string;
      marketName: string;
      streetAddress: string;
      area: string;
    };
    contactPerson: string;
    personMobileNo: string;
  };
}

interface TaskCardProps {
  title: string;
  task: Task;
  showStatusChip?: boolean;
}

interface LeadCardProps {
  lead: Lead;
  title?: string;
}

type OptionType = {
  label: string;
  value: string | number;
};

const InputReasonDialog = ({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (reason: string) => void;
}) => {
  const [input, setInput] = useState('');

  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="Input Reason of visit"
      maxWidth="sm"
      fullWidth
    >
      <Box sx={{ p: { xs: 2, sm: 3 }, background: '#fff', borderRadius: 2 }}>
        <Typography fontWeight={500} mb={1} fontSize={14}>
          Enter Reason
        </Typography>
        <ThemeInput
          placeholder="Typing..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          fullWidth
          sx={{ mb: 3 }}
        />
        <ThemeButton
          fullWidth
          sx={{
            background: '#28C76F',
            color: '#fff',
            fontWeight: 600,
            fontSize: 16,
            borderRadius: 2,
            py: 1.2,
            '&:hover': { background: '#079455' },
          }}
          onClick={() => {
            onSave(input);
            setInput('');
            onClose();
          }}
        >
          Save Reason
        </ThemeButton>
      </Box>
    </CustomDialog>
  );
};

const TaskCard: React.FC<TaskCardProps> = ({ title, task, showStatusChip = true }) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yy');
    } catch {
      return dateString;
    }
  };

  return (
    <Box mb={4} p={2} sx={{ backgroundColor: '#EDE9FE', borderRadius: 2 }}>
      <Typography component="div" fontWeight={600} color="primary" mb={2}>
        {title}
      </Typography>
      <Box display="flex" justifyContent="space-between" flexWrap="wrap" rowGap={1}>
        <Box>
          <Typography component="div">Created Time</Typography>
          <Typography component="div">
            <strong>{task.date ? `${formatDate(task.date)} ${task.time ? `, ${task.time}` : ''}` : '-'}</strong>
          </Typography>
        </Box>
        <Box>
          <Typography component="div">Visit Time</Typography>
          <Typography component="div">
            <strong>
              {task.visitDate ? `${formatDate(task.visitDate)} ${task.visitTime ? `, ${task.visitTime}` : ''}` : '-'}
            </strong>
          </Typography>
        </Box>
        <Box>
          <Typography component="div">Reason for visit</Typography>
          <Typography component="div">
            <strong>{task.reasonForVisit}</strong>
          </Typography>
        </Box>
        <Box>
          <Typography component="div">Status</Typography>
          {task.status ? (
            <ThemeChip
              label={task.status}
              color={
                task.status === 'Completed'
                  ? 'success'
                  : task.status === 'Pending'
                  ? 'warning'
                  : task.status === 'Cancelled'
                  ? 'error'
                  : 'primary'
              }
              variant="outlined"
              sx={{
                background:
                  task.status === 'Completed'
                    ? '#DCFCE7'
                    : task.status === 'Pending'
                    ? '#FEF9C3'
                    : task.status === 'Cancelled'
                    ? '#FEE2E2'
                    : '#E0F2FE',
                color:
                  task.status === 'Completed'
                    ? '#166534'
                    : task.status === 'Pending'
                    ? '#854D0E'
                    : task.status === 'Cancelled'
                    ? '#B91C1C'
                    : '#0369A1',
                fontWeight: 600,
                fontSize: 13,
                height: 24,
                px: 1,
                border: 'none',
              }}
            />
          ) : (
            showStatusChip && (
              <ThemeChip
                label="-"
                color="default"
                variant="outlined"
                sx={{
                  background: '#f3f4f6',
                  fontWeight: 600,
                  fontSize: 13,
                  height: 24,
                  px: 1,
                  border: 'none',
                }}
              />
            )
          )}
        </Box>
        <Box>
          <Typography component="div">Assign to</Typography>
          <Typography component="div">
            <strong>{task.assignTo ? `${task.assignTo.firstName} ${task.assignTo.lastName}` : '-'}</strong>
          </Typography>
        </Box>
      </Box>

      <Box mt={2}>
        <Typography component="div" fontWeight={500} color="text.secondary" mb={0.5}>
          Task Feedback
        </Typography>
        <ThemeInput
          label=""
          value={task.feedback || '-'}
          InputProps={{ readOnly: true }}
          multiline
          sx={{ width: '100%', background: '#fff', borderRadius: 1 }}
        />
      </Box>
    </Box>
  );
};

const LeadCard: React.FC<LeadCardProps> = ({ lead, title = 'Lead' }) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yy');
    } catch {
      return dateString;
    }
  };

  return (
    <Box mb={4} p={2} sx={{ backgroundColor: '#FEF9C3', borderRadius: 2, mt: 2 }}>
      <Typography component="div" fontWeight={600} color="warning.main" mb={2}>
        {title}
      </Typography>

      <Box display="flex" justifyContent="space-between" flexWrap="wrap" rowGap={1}>
        <Box>
          <Typography component="div">
            <strong>Called Time:</strong> {formatDate(lead.date)}
          </Typography>
        </Box>
        <Box>
          <Typography component="div">
            <strong>Reason for Call:</strong> {lead.reason}
          </Typography>
        </Box>
        <Box>
          <Typography component="div">
            <strong>Status:</strong>
          </Typography>
          <ThemeChip
            label={lead.status}
            color={
              lead.status === 'completed'
                ? 'success'
                : lead.status === 'pending'
                ? 'warning'
                : lead.status === 'cancelled'
                ? 'error'
                : 'primary'
            }
            variant="outlined"
            sx={{
              background:
                lead.status === 'completed'
                  ? '#DCFCE7'
                  : lead.status === 'pending'
                  ? '#FEF9C3'
                  : lead.status === 'cancelled'
                  ? '#FEE2E2'
                  : '#E0F2FE',
              color:
                lead.status === 'completed'
                  ? '#166534'
                  : lead.status === 'pending'
                  ? '#854D0E'
                  : lead.status === 'cancelled'
                  ? '#B91C1C'
                  : '#0369A1',
              fontWeight: 600,
              fontSize: 13,
              height: 24,
              px: 1,
              border: 'none',
            }}
          />
        </Box>
        <Box>
          <Typography component="div">
            <strong>Assign to:</strong>{' '}
            {lead.assignedTo ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}` : '-'}
          </Typography>
        </Box>
      </Box>

      <Box mt={2}>
        <Typography component="div" fontWeight={500} color="text.secondary" mb={0.5}>
          Call Feedback
        </Typography>
        <ThemeInput
          label=""
          value={lead.callFeedback || '-'}
          InputProps={{ readOnly: true }}
          multiline
          sx={{ width: '100%', background: '#fff', borderRadius: 1 }}
        />
      </Box>
    </Box>
  );
};

const ViewCompanyPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { id } = router.query;

  // Redux state selectors
  const { singleAccountMaster, accountMasters, loading: accountLoading } = useSelector(
    (state: any) => state.accountMasters,
  );
  const { assignTasks, loading: taskLoading } = useSelector((state: any) => state.assignTasks);
  const { leads, loading: leadLoading } = useSelector((state: any) => state.leads);
  // Tier 1 security audit fix (2026-09-01), Fix 3: this page's staff picker
  // only ever needed id + name, so it uses staffListLite (no setup.staff
  // view permission required) instead of the full staff roster.
  const { staffListLite: staffList, staffListLiteLoading: staffLoading } = useSelector((state: any) => state.staff);
  const { opportunities, loading: opportunitiesLoading } = useSelector((state: any) => state.opportunities);

  // Local state
  const [openAssignTaskDialog, setOpenAssignTaskDialog] = useState(false);
  const [openAddOrderDialog, setOpenAddOrderDialog] = useState(false);
  const [company, setCompany] = useState<OptionType | null>(null);
  const [party, setParty] = useState<OptionType | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [reasons, setReasons] = useState<OptionType[]>([]);
  const [inputReasonOpen, setInputReasonOpen] = useState(false);
  const [staff, setStaff] = useState<OptionType | null>(null);
  const [remarks, setRemarks] = useState('');

  // Transform API data to match Task and Lead interfaces
  const transformedTasks: Task[] = assignTasks.map((task: any) => ({
  _id: task._id || '',
  companyName: task.companyName?.companyName || '',
  partyName: task.partyName?.partyName || '',
  date: task.date || '',
  time: task.time || '',
  visitDate: task.visitDate || '',
  visitTime: task.visitTime || '',
  reasonForVisit: task.reasonForVisit || '',
  status: task.status || '',
  assignTo: {
    _id: task.assignTo?._id || '',
    firstName: task.assignTo?.firstName || '',
    lastName: task.assignTo?.lastName || '',
  },
  feedback: task.feedback || '',
  createdAt: task.createdAt || '',
  updatedAt: task.updatedAt || '',
  accountDetails: {
    _id: task.accountMaster?._id || '',
    companyName: task.accountMaster?.companyName?.companyName || '',
    partyName: task.accountMaster?.party?.partyName || '',
    address: {
      unitNo: task.accountMaster?.party?.address?.unitNo || '',
      marketName: task.accountMaster?.party?.address?.marketName || '',
      streetAddress: task.accountMaster?.party?.address?.streetAddress || '',
      area: task.accountMaster?.party?.address?.area || '',
      pincode: task.accountMaster?.party?.address?.pincode || '',
    },
    contactPerson: task.accountMaster?.party?.contactPerson || '',
    personMobileNo: task.accountMaster?.party?.personMobileNo || '',
  },
}));

  const transformedLeads: Lead[] = leads.map((lead: any) => ({
  _id: lead._id || '',
  companyName: lead.companyName?.companyName || '',
  partyName: lead.partyName?.partyName || '',
  mobile: lead.partyName?.personMobileNo || '',
  status: lead.status || '',
  reason: lead.reason || '',
  remark: lead.callFeedback || '',
  callFeedback: lead.callFeedback || '',
  assignedTo: {
    _id: lead.assignedTo?._id || '',
    firstName: lead.assignedTo?.firstName || '',
    lastName: lead.assignedTo?.lastName || '',
  },
  createdAt: lead.createdAt || '',
  date: lead.date || '',
  time: '',
  accountDetails: {
    _id: lead.partyName?._id || '',
    companyName: lead.companyName?.companyName || '',
    partyName: lead.partyName?.partyName || '',
    address: {
      unitNo: lead.partyName?.address?.unitNo || '',
      marketName: lead.partyName?.address?.marketName || '',
      streetAddress: lead.partyName?.address?.streetAddress || '',
      area: lead.partyName?.address?.area || '',
    },
    contactPerson: lead.partyName?.contactPerson || '',
    personMobileNo: lead.partyName?.personMobileNo || '',
  },
}));

  // Filter tasks and leads based on party/company ID
  const pendingTasks = transformedTasks.filter(
    (task) =>
      task.status === 'Pending' &&
      (task.accountDetails._id === id || task.partyName === singleAccountMaster?.partyName),
  );

  const historyTasks = transformedTasks.filter(
    (task) =>
      task.status !== 'Pending' &&
      (task.accountDetails._id === id || task.partyName === singleAccountMaster?.partyName),
  );

  const pendingLeads = transformedLeads.filter(
    (lead) =>
      lead.status === 'pending' &&
      (lead.accountDetails._id === id || lead.partyName === singleAccountMaster?.partyName),
  );

  const historyLeads = transformedLeads.filter(
    (lead) =>
      lead.status !== 'pending' &&
      (lead.accountDetails._id === id || lead.partyName === singleAccountMaster?.partyName),
  );

  useEffect(() => {
    if (id) {
      dispatch(getAccountMasterByIdThunk(id as string));
      dispatch(getAllAssignTasksThunk());
      dispatch(getAllLeadsThunk());
      dispatch(getStaffListLiteThunk());
      // QA-M4 fix (2026-09-01): getAccountMasterById's response only ever
      // carries the account_masters row's own id (mirrored into `_id` by
      // withMongoId) -- it never included the linked parties.id. This page
      // used to treat singleAccountMaster._id as if it were the party id,
      // but account_masters and parties are two disjoint tables (0
      // overlapping ids, live-verified) linked only by
      // account_masters.party_id -> parties.id. getAllAccountMasters
      // already resolves that join server-side (AM_SELECT's
      // `party:party_id(...)`), the same way the Module 15 party-360 panel
      // resolves a real parties.id from this same URL account_master id --
      // so fetch that list here too and look up this account master's
      // real party id from it (see resolvedPartyId below), instead of
      // repeating the account_masters.id-as-party-id mistake.
      dispatch(getAllAccountMastersThunk());
    }
  }, [dispatch, id]);

  // Real parties.id for this account master, resolved from the
  // account_masters list (each entry's `.party._id` is the joined
  // parties.id -- see AM_SELECT on the backend). Shared by both the
  // "Assign task" dialog and the Opportunity History fetch below so the
  // resolution logic lives in exactly one place on this page.
  const resolvedPartyId: string = React.useMemo(() => {
    if (!id || !Array.isArray(accountMasters)) return '';
    const match = accountMasters.find((am: any) => am._id === id);
    return match?.party?._id || '';
  }, [accountMasters, id]);

  useEffect(() => {
    if (singleAccountMaster) {
      setCompany({
        label: singleAccountMaster.companyNameObj?.companyName || singleAccountMaster.companyName || '',
        value: singleAccountMaster.companyName || '',
      });
      setParty({
        label: singleAccountMaster.partyName || '',
        value: singleAccountMaster._id || '',
      });

      if (singleAccountMaster.reasonToVisit) {
        setReasons([{ label: singleAccountMaster.reasonToVisit, value: singleAccountMaster.reasonToVisit }]);
      }
    }
  }, [singleAccountMaster, dispatch]);

  // QA-M4 fix (2026-09-01): opportunities.party_id is a real parties.id,
  // not an account_masters.id, so this filter needs resolvedPartyId (see
  // above) rather than singleAccountMaster._id -- previously this always
  // filtered by the wrong id, so a real account master with a real
  // opportunity showed an empty "no opportunities" state.
  useEffect(() => {
    if (resolvedPartyId) {
      dispatch(getAllOpportunitiesThunk({ partyId: resolvedPartyId }));
    }
  }, [resolvedPartyId, dispatch]);

  useEffect(() => {
    if (staffList.length > 0) {
      setStaff({
        label: staffList[0].name,
        value: staffList[0].id,
      });
    }
  }, [staffList]);

  const handleAssign = (taskData: any) => {
    dispatch(createAssignTaskThunk(taskData));
    setOpenAssignTaskDialog(false);
  };

  const handleReschedule = (taskId: string, updatedData: any) => {
    dispatch(updateAssignTaskThunk({ id: taskId, data: updatedData }));
  };

  if (accountLoading || taskLoading || leadLoading || staffLoading) {
    return <Loader />;
  }

  if (!singleAccountMaster) {
    return <div>Company not found</div>;
  }

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Fixed Header */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          backgroundColor: '#fff',
          zIndex: 1000,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          p: 3,
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
    <IconButton
      onClick={() => router.back()}
      sx={{ p: 0, color: 'primary.main' }}
    >
      <MdTurnLeft size={24} />
    </IconButton>
    <Typography variant="h6" component="div" sx={{ fontWeight: 400 }}>
      {singleAccountMaster.partyName} |{" "}
      {singleAccountMaster.companyNameObj?.companyName ||
        singleAccountMaster.companyName}{" "}
      | created by{" "}
      {singleAccountMaster.createdByObj?.firstName || "Staff"}
    </Typography>
  </Box>

  {/* Right side: Assign button */}
  {/* QA-M4 fix (2026-09-01): this used to navigate to the generic
      /admin/assign-task page instead of opening this page's own
      already-built AssignTaskDialog below (pre-filled with this party). */}
  <ThemeButton
    onClick={() => {
      setOpenAssignTaskDialog(true);
    }}
  >
    + Assign New task
  </ThemeButton>
</Box>

        <Box display="flex" flexWrap="wrap" justifyContent="space-between" mb={4} gap={2}>
         
        <Box>
      <Typography component="div" fontWeight={600}>
        Mobile No.
      </Typography>
      <Typography component="div">
        <strong>Owner:</strong> {singleAccountMaster?.ownerMobileNo || '-'}
      </Typography>
      <Typography component="div">
        <strong>Person:</strong> {singleAccountMaster?.personMobileNo || '-'}
      </Typography>
      <Typography component="div">
        <strong>Payment:</strong> {singleAccountMaster?.contactMobileNo || '-'}
      </Typography>
    </Box>

          <Box>
            <Typography component="div" fontWeight={600}>
              Contact Person
            </Typography>
            <Typography component="div"> <strong>Owner:</strong> {singleAccountMaster.ownerName}</Typography>
            <Typography component="div"> <strong>Person:</strong> {singleAccountMaster.contactPerson}</Typography>
            <Typography component="div"> <strong>Payment:</strong> {singleAccountMaster.contactForPayment}</Typography>
          </Box>
          <Box>
            <Typography component="div" fontWeight={600}>
              Email Id
            </Typography>
            <Typography component="div"> <strong>Owner Email:</strong> {singleAccountMaster.ownerEmail }</Typography>
            <Typography component="div"> <strong>Person Email:</strong> {singleAccountMaster.contactPersonEmail }</Typography>
            <Typography component="div"> <strong>Payment Email:</strong> {singleAccountMaster.contactForPaymentEmail }</Typography>
          </Box>
                  <Box>
            <Typography component="div">
            <strong>Reference:</strong> {singleAccountMaster?.reference || '-'}
          </Typography>
        </Box>
          <Box>
            <Typography component="div" fontWeight={600}>
              Unit Name
            </Typography>
            <Typography component="div">{singleAccountMaster.address.unitNo}</Typography>
          </Box>
          <Box>
            <Typography component="div" fontWeight={600}>
              Market Name
            </Typography>
            <Typography component="div">{singleAccountMaster.address.marketName}</Typography>
          </Box>
          <Box>
            <Typography component="div" fontWeight={600}>
              Area
            </Typography>
            <Typography component="div">{singleAccountMaster.address.area}</Typography>
          </Box>
           <Box>
            <Typography component="div" fontWeight={600}>
              Address
            </Typography>
            <Typography component="div">
              {singleAccountMaster.address.unitNo}, {singleAccountMaster.address.marketName},{' '}
              {singleAccountMaster.address.streetAddress}, {singleAccountMaster.address.area},{' '}
              {singleAccountMaster.address.pincode}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Content Container */}
      <Box sx={{ p: 3, bgcolor: '#f5f5f5', flexGrow: 1 }}>
        {/* Pending Tasks Section */}
        {pendingTasks.length > 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography component="div" fontWeight={600} color="primary" mb={2}>
                Pending Task{pendingTasks.length > 1 ? 's' : ''}
              </Typography>
              {/* QA-M4 fix (2026-09-01): this AssignTaskDialog trigger was
                  dead JSX (commented out) -- re-enabled. It already wires
                  the same open/close state (openAssignTaskDialog) as the
                  header's "+ Assign New task" button above. */}
              <ThemeButton
                variant="outlined"
                onClick={() => setOpenAssignTaskDialog(true)}
                sx={{ py: 0.6, mb: 2 }}
                startIcon={<MdTurnLeft style={{ fontSize: 18, color: '#98A2B3' }} />}
              >
                Re-Schedule
              </ThemeButton>
            </Box>

            {pendingTasks.map((task: Task, idx: number) => (
              <TaskCard key={`pending-task-${idx}`} title="Task" task={task} />
            ))}
          </>
        )}
        {/* Pending Leads Section */}
        {pendingLeads.length > 0 && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography component="div" fontWeight={600} color="warning.main">
                Pending Party{pendingLeads.length > 1 ? 's' : ''}
              </Typography>
            </Box>

            {pendingLeads.map((lead: Lead, idx: number) => (
              <LeadCard key={`pending-lead-${idx}`} lead={lead} title="Pending Lead" />
            ))}
          </>
        )}
        {/* Task History Section */}
        {historyTasks.length > 0 && (
          <>
            <Typography component="div" fontWeight={600} color="primary" mb={2}>
              Task History
            </Typography>
            {historyTasks.map((task: Task, idx: number) => (
              <TaskCard key={`history-task-${idx}`} title="Task" task={task} />
            ))}
          </>
        )}

        {/* Lead History Section */}
        {historyLeads.length > 0 && (
          <>
            <Typography component="div" fontWeight={600} color="warning.main" mb={2}>
              Lead History
            </Typography>
            {historyLeads.map((lead: Lead, idx: number) => (
              <LeadCard key={`history-lead-${idx}`} lead={lead} title="Lead" />
            ))}
          </>
        )}

        {/* Opportunity History Section */}
        {opportunities.length > 0 && (
          <>
            <Typography component="div" fontWeight={600} color="primary" mb={2}>
              Opportunity History
            </Typography>
            {opportunities.map((opp: any) => (
              <Box
                key={opp._id}
                onClick={() => router.push(`/admin/crm/opportunities/view/${opp._id}`)}
                sx={{
                  bgcolor: '#fff',
                  borderRadius: 2,
                  p: 2,
                  mb: 2,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <Box>
                  <Typography component="div" fontWeight={600}>
                    {opp.opportunityNumber} — {opp.prospectName}
                  </Typography>
                  <Typography component="div" fontSize={13} color="textSecondary">
                    {opp.estimatedValue ? `Est. ${opp.estimatedValue.toLocaleString()}` : 'No estimated value'}
                  </Typography>
                </Box>
                <ThemeChip label={opp.stage} />
              </Box>
            ))}
          </>
        )}

        {/* Show message if no tasks, leads, or opportunities found */}
        {pendingTasks.length === 0 &&
          historyTasks.length === 0 &&
          pendingLeads.length === 0 &&
          historyLeads.length === 0 &&
          opportunities.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="textSecondary">
                No tasks, leads, or opportunities found for this party
              </Typography>
            </Box>
          )}
      </Box>

      {typeof id === 'string' && <PartyThreeSixtyPanel accountMasterId={id} />}

      <AssignTaskDialog
        open={openAssignTaskDialog}
        onClose={() => setOpenAssignTaskDialog(false)}
        selectedParties={
          // QA-M4 fix (2026-09-01): AssignTaskDialog sends this partyId
          // straight through as assign_tasks.party_name_id, which is an FK
          // to parties.id -- singleAccountMaster._id is an account_masters
          // id (a genuinely different table, 0 overlapping ids
          // live-verified) and would throw a Postgres FK violation on
          // submit. resolvedPartyId (above) is the real parties.id for
          // this account master.
          singleAccountMaster && resolvedPartyId
            ? [
                {
                  partyId: resolvedPartyId,
                  companyId: singleAccountMaster.companyName || '',
                },
              ]
            : []
        }
        refreshData={() => {
          dispatch(getAllAssignTasksThunk());
        }}
      />

      <AddOrderDialog
        open={openAddOrderDialog}
        onClose={() => setOpenAddOrderDialog(false)}
      />

      <InputReasonDialog
        open={inputReasonOpen}
        onClose={() => setInputReasonOpen(false)}
        onSave={(reason) => {
          setReasons([...reasons, { label: reason, value: reason }]);
        }}
      />
    </Box>
  );
};

export default ViewCompanyPage;