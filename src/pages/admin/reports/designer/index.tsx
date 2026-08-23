import React from 'react';
import { useRouter } from 'next/router';
import Dashboard from '@/component/Dashboard';
import BasicTable from '@/component/common_component/Table/themetable';
import { TableCell, Box } from '@mui/material';
import { FaChevronRight } from 'react-icons/fa6';

const columns = [
  { id: 'received', label: 'Received' },
  { id: 'party', label: 'Party Name' },
  { id: 'designer', label: 'Designer' },
  { id: 'orderNo', label: 'Order No' },
  { id: 'item', label: 'Item Name' },
  { id: 'sentForApproval', label: 'Sent for approval' },
  { id: 'approvalReceived', label: 'Approval Received' },
  { id: 'finalPrintFile', label: 'Final Print file' },
];

const rows = [
  {
    id: '1',
    received: '01/04/25 , 10:10AM',
    party: 'Mr . Shah',
    designer: 'Raj',
    orderNo: '123',
    item: 'Order Form',
    sentForApproval: '01/04/25 , 10:10AM',
    approvalReceived: '01/04/25 , 10:10AM',
    finalPrintFile: '01/04/25 , 10:10AM',
  },
  {
    id: '2',
    received: '01/04/25 , 10:10AM',
    party: 'Mr. Roy',
    designer: 'Dhruv',
    orderNo: '124',
    item: 'Bill Book',
    sentForApproval: '01/04/25 , 10:10AM',
    approvalReceived: '01/04/25 , 10:10AM',
    finalPrintFile: '01/04/25 , 10:10AM',
  },
  {
    id: '3',
    received: '01/04/25 , 10:10AM',
    party: 'Mr. Akash',
    designer: 'Sagar',
    orderNo: '125',
    item: 'Register',
    sentForApproval: '01/04/25 , 10:10AM',
    approvalReceived: '01/04/25 , 10:10AM',
    finalPrintFile: '01/04/25 , 10:10AM',
  },
];

const csvColumns = [
  { id: 'received', label: 'Received', value: (row: (typeof rows)[number]) => row.received },
  { id: 'party', label: 'Party Name', value: (row: (typeof rows)[number]) => row.party },
  { id: 'designer', label: 'Designer', value: (row: (typeof rows)[number]) => row.designer },
  { id: 'orderNo', label: 'Order No', value: (row: (typeof rows)[number]) => row.orderNo },
  { id: 'item', label: 'Item Name', value: (row: (typeof rows)[number]) => row.item },
  { id: 'sentForApproval', label: 'Sent for approval', value: (row: (typeof rows)[number]) => row.sentForApproval },
  { id: 'approvalReceived', label: 'Approval Received', value: (row: (typeof rows)[number]) => row.approvalReceived },
  { id: 'finalPrintFile', label: 'Final Print file', value: (row: (typeof rows)[number]) => row.finalPrintFile },
];

const DesignerPage = () => {
  const router = useRouter();

  type OrderRow = {
    orderNo: string;
    party: string;
  };
  
  const handleRowClick = (row: OrderRow) => {
    if (!row?.orderNo || !row?.party) {
      console.warn("Missing orderNo or party");
      return;
    }
  
    router.push({
      pathname: '/admin/all-orders/view/designer',
      query: {
        orderNo: row.orderNo,
        party: row.party,
      },
    });
  };
  

  return (
    
      <BasicTable
        tableHeader={columns}
        rowData={rows}
        csvColumns={csvColumns}
        exportFilename="designer"
        renderRow={(row) => (
          <>
          <TableCell>{row.received}</TableCell>
            <TableCell>
              <Box
                sx={{ cursor: 'pointer' }}
                onClick={() => handleRowClick(row)}
              >
                {row.party}
              </Box>
            </TableCell>
            <TableCell>
              <Box sx={{ cursor: 'pointer' }} onClick={() => handleRowClick(row)}>
                {row.designer}
              </Box>
            </TableCell>
            <TableCell>{row.orderNo}</TableCell>
            <TableCell>{row.item}</TableCell>
            
            <TableCell>{row.sentForApproval}</TableCell>
            <TableCell>{row.approvalReceived}</TableCell>
            <TableCell>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
                sx={{ cursor: 'pointer' }}
                onClick={() => handleRowClick(row)}
              >
                <Box>{row.finalPrintFile}</Box>
                <FaChevronRight style={{ fontSize: 16, color: '#98A2B3', marginLeft: 8 }} />
              </Box>
            </TableCell>
          </>
        )}
      />
  );
};

export default DesignerPage;
