import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Receipt } from 'lucide-react-native';
import { Header } from '../components/Header';
import { TabSelector } from '../components/TabSelector';
import { PaymentCard } from '../components/PaymentCard';
import { PaymentDetailModal } from '../components/PaymentDetailModal';
import { useBottomNavPadding } from '../components/CustomBottomNav';
import { walletService } from '../services/walletService';
import { depositService, DepositRecord } from '../services/depositService';
import { withdrawalService, WithdrawalRecord } from '../services/withdrawalService';
import { ApiTransaction, PaymentItem } from '../types';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';

interface PaymentHistoryScreenProps {
  onBack?: () => void;
  showBack?: boolean;
}

const buildMergedPaymentItems = (
  rawTxs: ApiTransaction[] = [],
  deposits: DepositRecord[] = [],
  withdrawals: WithdrawalRecord[] = []
): { receive: PaymentItem[]; purchase: PaymentItem[] } => {
  const receiveList: PaymentItem[] = [];
  const purchaseList: PaymentItem[] = [];

  // Sets for tracking seen IDs, references, and UTRs to guarantee zero duplicates
  const processedTxIds = new Set<string>();
  const processedReferenceIds = new Set<string>();
  const processedUtrs = new Set<string>();

  // Helper to extract UTR from description strings if present
  const extractUtr = (str?: string): string | null => {
    if (!str) return null;
    const match = str.match(/UTR[:\s-]+([A-Za-z0-9]+)/i);
    return match && match[1] ? match[1].trim().toLowerCase() : null;
  };

  // Pre-seed reference tracking from wallet transactions
  for (const tx of rawTxs) {
    if (tx._id) processedReferenceIds.add(String(tx._id));
    if (tx.referenceId) {
      const refStr = String(tx.referenceId).trim();
      processedReferenceIds.add(refStr);
      processedUtrs.add(refStr.toLowerCase());
    }
    const utrFromDesc = extractUtr(tx.description);
    if (utrFromDesc) {
      processedUtrs.add(utrFromDesc);
    }
  }

  // 1. Map existing wallet ledger transactions
  for (const tx of rawTxs) {
    if (!tx || !tx._id) continue;
    const txId = String(tx._id);
    if (processedTxIds.has(txId)) continue;
    processedTxIds.add(txId);

    const isCredit = tx.type === 'credit';
    const dateObj = new Date(tx.createdAt);
    const dateFormatted = isNaN(dateObj.getTime())
      ? tx.createdAt
      : dateObj.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
    const timeFormatted = isNaN(dateObj.getTime())
      ? ''
      : dateObj.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        });

    const statusLabel: 'New' | 'Completed' | 'Processing' | 'Pending' | 'Failed' =
      tx.status === 'completed'
        ? 'Completed'
        : tx.status === 'pending'
        ? 'Pending'
        : tx.status === 'failed'
        ? 'Failed'
        : 'New';

    // USER REQUIREMENT:
    // Entries showing in purchase must be shown in receive,
    // and entries showing in receive must be shown in purchase!
    // Debits/Withdrawals (!isCredit) -> receive
    // Credits/Deposits (isCredit) -> purchase
    const item: PaymentItem = {
      id: txId,
      orderCode: tx._id ? tx._id.slice(-8).toUpperCase() : 'DRMPAY',
      date: `${dateFormatted} ${timeFormatted}`.trim(),
      amount: Number(tx.amount) || 0,
      currency: '₹',
      status: statusLabel,
      method: (tx.category || tx.type || 'wallet').replace('_', ' ').toUpperCase(),
      fee: 0,
      description: tx.description,
      terminalId: tx._id ? `TRM-${tx._id.slice(-4).toUpperCase()}` : 'TRM-MAIN',
      type: isCredit ? 'purchase' : 'receive',
    };

    (item as any).rawDate = tx.createdAt;

    if (isCredit) {
      const isTaskReward =
        tx.category === "task_reward" ||
        (typeof tx.description === "string" &&
          tx.description.toLowerCase().startsWith("task reward"));
      if (!isTaskReward) {
        purchaseList.push(item);
      }
    } else {
      receiveList.push(item);
    }
  }

  // 2. Merge Deposits (Deposits show under Purchase)
  for (const dep of deposits) {
    if (!dep || !dep._id) continue;
    const depId = String(dep._id);
    const utr = dep.transactionRef ? dep.transactionRef.trim().toLowerCase() : '';

    // Check if already merged or UTR already recorded in ledger
    if (processedReferenceIds.has(depId)) continue;
    if (utr && processedUtrs.has(utr)) continue;

    // Check if approved deposit is already represented in raw wallet transactions
    if (dep.status === 'approved') {
      const depTime = new Date(dep.createdAt).getTime();
      const alreadyInRaw = rawTxs.some((tx) => {
        if (tx.type !== 'credit') return false;
        if (Number(tx.amount) !== Number(dep.amount)) return false;
        const txTime = new Date(tx.createdAt).getTime();
        return Math.abs(txTime - depTime) < 2 * 60 * 60 * 1000 || tx.category === 'deposit';
      });
      if (alreadyInRaw) {
        processedReferenceIds.add(depId);
        if (utr) processedUtrs.add(utr);
        continue;
      }
    }

    processedReferenceIds.add(depId);
    if (utr) processedUtrs.add(utr);

    const dateObj = new Date(dep.createdAt);
    const dateFormatted = isNaN(dateObj.getTime())
      ? dep.createdAt
      : dateObj.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
    const timeFormatted = isNaN(dateObj.getTime())
      ? ''
      : dateObj.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        });

    const isPending = dep.status === 'pending';
    const isApproved = dep.status === 'approved';

    const statusLabel: 'New' | 'Completed' | 'Processing' | 'Pending' | 'Failed' =
      isApproved ? 'Completed' : isPending ? 'Pending' : 'Failed';

    const item: PaymentItem = {
      id: depId,
      orderCode: dep.transactionRef
        ? (dep.transactionRef.length > 8 ? dep.transactionRef.slice(-8).toUpperCase() : dep.transactionRef.toUpperCase())
        : dep._id.slice(-8).toUpperCase(),
      date: `${dateFormatted} ${timeFormatted}`.trim(),
      amount: Number(dep.amount) || 0,
      currency: '₹',
      status: statusLabel,
      method: 'UPI DIRECT DEPOSIT',
      fee: 0,
      description: isPending
        ? `Deposit • UTR: ${dep.transactionRef || 'Pending'} (Awaiting Admin Verification)`
        : `Deposit • UTR: ${dep.transactionRef || 'Approved'}`,
      terminalId: `DEP-${dep._id.slice(-4).toUpperCase()}`,
      type: 'purchase',
    };
    (item as any).rawDate = dep.createdAt;
    purchaseList.push(item);
  }

  // 3. Merge Withdrawals (Withdrawals show under Receive)
  for (const w of withdrawals) {
    if (!w || !w._id) continue;
    const wId = String(w._id);

    if (processedReferenceIds.has(wId)) continue;

    // Check if approved withdrawal is already represented in raw wallet transactions
    if (w.status === 'approved') {
      const wTime = new Date(w.createdAt).getTime();
      const alreadyInRaw = rawTxs.some((tx) => {
        if (tx.type !== 'debit') return false;
        if (Number(tx.amount) !== Number(w.amount)) return false;
        const txTime = new Date(tx.createdAt).getTime();
        return Math.abs(txTime - wTime) < 2 * 60 * 60 * 1000 || tx.category === 'withdrawal';
      });
      if (alreadyInRaw) {
        processedReferenceIds.add(wId);
        continue;
      }
    }

    processedReferenceIds.add(wId);

    const dateObj = new Date(w.createdAt);
    const dateFormatted = isNaN(dateObj.getTime())
      ? w.createdAt
      : dateObj.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
    const timeFormatted = isNaN(dateObj.getTime())
      ? ''
      : dateObj.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
        });

    const isPending = w.status === 'pending';
    const isApproved = w.status === 'approved';

    const statusLabel: 'New' | 'Completed' | 'Processing' | 'Pending' | 'Failed' =
      isApproved ? 'Completed' : isPending ? 'Pending' : 'Failed';

    const item: PaymentItem = {
      id: wId,
      orderCode: w._id.slice(-8).toUpperCase(),
      date: `${dateFormatted} ${timeFormatted}`.trim(),
      amount: Number(w.amount) || 0,
      currency: '₹',
      status: statusLabel,
      method: 'BANK WITHDRAWAL',
      fee: 0,
      description: isPending
        ? `Withdrawal to ${w.bankDetails?.upiId || 'UPI'} (Under Review)`
        : `Withdrawal Settled to ${w.bankDetails?.upiId || 'UPI'}`,
      terminalId: `WTH-${w._id.slice(-4).toUpperCase()}`,
      type: 'receive',
    };
    (item as any).rawDate = w.createdAt;
    receiveList.push(item);
  }

  // 4. Secondary deduplication on both lists by unique ID
  const deduplicateList = (items: PaymentItem[]): PaymentItem[] => {
    const seen = new Set<string>();
    const result: PaymentItem[] = [];
    for (const item of items) {
      if (!item.id || seen.has(item.id)) continue;
      seen.add(item.id);
      result.push(item);
    }
    return result;
  };

  const finalReceive = deduplicateList(receiveList);
  const finalPurchase = deduplicateList(purchaseList);

  const sortByDate = (a: any, b: any) => {
    const tA = new Date(a.rawDate).getTime();
    const tB = new Date(b.rawDate).getTime();
    return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
  };

  finalReceive.sort(sortByDate);
  finalPurchase.sort(sortByDate);

  return { receive: finalReceive, purchase: finalPurchase };
};

export const PaymentHistoryScreen: React.FC<PaymentHistoryScreenProps> = ({
  onBack,
  showBack = false,
}) => {
  const [activeTab, setActiveTab] = useState<'receive' | 'purchase'>('receive');
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [mergedPayments, setMergedPayments] = useState<{ receive: PaymentItem[]; purchase: PaymentItem[] }>({
    receive: [],
    purchase: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const bottomNavPadding = useBottomNavPadding();

  const tabs = [
    { id: 'receive' as const, label: 'Receive' },
    { id: 'purchase' as const, label: 'Purchase' },
  ];

  useEffect(() => {
    let isCancelled = false;
    Promise.allSettled([
      walletService.getTransactions({ limit: 50 }),
      depositService.getDepositHistory(),
      withdrawalService.getWithdrawalHistory(),
    ])
      .then(([txRes, depRes, withRes]) => {
        if (isCancelled) return;
        const rawTxs = txRes.status === 'fulfilled' && txRes.value?.transactions ? txRes.value.transactions : [];
        const deposits = depRes.status === 'fulfilled' && Array.isArray(depRes.value) ? depRes.value : [];
        const withdrawals = withRes.status === 'fulfilled' && Array.isArray(withRes.value) ? withRes.value : [];
        const merged = buildMergedPaymentItems(rawTxs, deposits, withdrawals);
        setMergedPayments(merged);
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const [txRes, depRes, withRes] = await Promise.allSettled([
        walletService.getTransactions({ limit: 50 }),
        depositService.getDepositHistory(),
        withdrawalService.getWithdrawalHistory(),
      ]);
      const rawTxs = txRes.status === 'fulfilled' && txRes.value?.transactions ? txRes.value.transactions : [];
      const deposits = depRes.status === 'fulfilled' && Array.isArray(depRes.value) ? depRes.value : [];
      const withdrawals = withRes.status === 'fulfilled' && Array.isArray(withRes.value) ? withRes.value : [];
      const merged = buildMergedPaymentItems(rawTxs, deposits, withdrawals);
      setMergedPayments(merged);
    } catch (error) {
      console.warn('Failed to load transaction history:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const paymentItems: PaymentItem[] = activeTab === 'receive' ? mergedPayments.receive : mergedPayments.purchase;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      <Header
        title="Payment History"
        showBack={showBack}
        onBack={onBack}
        centerTitle
      />

      <View style={styles.mainContainer}>
        <View style={styles.tabContainer}>
          <TabSelector
            tabs={tabs}
            activeTab={activeTab}
            onSelectTab={(tab) => setActiveTab(tab)}
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Fetching live ledger...</Text>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.listContent, { paddingBottom: bottomNavPadding }]}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={Colors.primary}
                colors={[Colors.primary]}
              />
            }
          >
            {paymentItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Receipt size={32} color={Colors.textMuted} />
                </View>
                <Text style={styles.emptyTitle}>No Transactions Yet</Text>
                <Text style={styles.emptySubtitle}>
                  {activeTab === 'receive'
                    ? 'No receive or withdrawal transactions found in your account.'
                    : 'No purchase or deposit transactions found in your account.'}
                </Text>
              </View>
            ) : (
              paymentItems.map((payment) => (
                <PaymentCard
                  key={payment.id}
                  payment={payment}
                  onPress={(item) => setSelectedPayment(item)}
                />
              ))
            )}
          </ScrollView>
        )}
      </View>

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        visible={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        data={selectedPayment}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  mainContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
  },
  tabContainer: {
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  listContent: {
    paddingHorizontal: Spacing.md,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyTitle: {
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
