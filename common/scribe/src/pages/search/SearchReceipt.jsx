import React from 'react';
import ReceiptSearchBar from '../../components/receiptSearch';
import RecentDrafts from './RecentDrafts';

export default function SearchReceipt() {
  return (
    <div className="page_min_height">
      <ReceiptSearchBar />
      <RecentDrafts />
    </div>
  );
}
