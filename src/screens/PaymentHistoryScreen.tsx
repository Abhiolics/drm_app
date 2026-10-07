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
  const processedDepositIds = new Set<string>();
  const processedUtrs = new Set<string>();

  // 1. Map existing wallet ledger transactions
  for (const tx of rawTxs) {
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

    if (tx.referenceId) processedDepositIds.add(String(tx.referenceId));
    processedDepositIds.add(String(tx._id));

    const statusLabel: 'New' | 'Completed' | 'Processing' | 'Pending' | 'Failed' =
      tx.status === 'completed'
        ? 'Completed'
        : tx.status === 'pending'
        ? 'Pending'
        : tx.status === 'failed'
        ? 'Failed'
        : 'New';

    const item: PaymentItem = {
      id: tx._id,
      orderCode: tx._id ? tx._id.slice(-8).toUpperCase() : 'DRMPAY',
      date: `${dateFormatted} ${timeFormatted}`.trim(),
      amount: tx.amount,
      currency: '₹',
      status: statusLabel,
      method: (tx.category || tx.type || 'wallet').replace('_', ' ').toUpperCase(),
      fee: 0,
      description: tx.description,
      terminalId: tx._id ? `TRM-${tx._id.slice(-4).toUpperCase()}` : 'TRM-MAIN',
      type: isCredit ? 'receive' : 'purchase',
    };

    (item as any).rawDate = tx.createdAt;

    if (isCredit) {
      receiveList.push(item);
    } else {
      purchaseList.push(item);
    }
  }

  // 2. Merge Deposits (Pending ones show in Receive / Credits)
  for (const dep of deposits) {
    if (processedDepositIds.has(String(dep._id))) continue;
    if (dep.transactionRef && processedUtrs.has(dep.transactionRef)) continue;
    if (dep.transactionRef) processedUtrs.add(dep.transactionRef);

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
      id: dep._id,
      orderCode: dep.transactionRef
        ? (dep.transactionRef.length > 8 ? dep.transactionRef.slice(-8).toUpperCase() : dep.transactionRef.toUpperCase())
        : dep._id.slice(-8).toUpperCase(),
      date: `${dateFormatted} ${timeFormatted}`.trim(),
      amount: Number(dep.amount),
      currency: '₹',
      status: statusLabel,
      method: 'UPI DIRECT DEPOSIT',
      fee: 0,
      description: isPending
        ? `Deposit • UTR: ${dep.transactionRef || 'Pending'} (Awaiting Admin Verification)`
        : `Deposit • UTR: ${dep.transactionRef || 'Approved'}`,
      terminalId: `DEP-${dep._id.slice(-4).toUpperCase()}`,
      type: 'receive',
    };
    (item as any).rawDate = dep.createdAt;
    receiveList.push(item);
  }

  // 3. Merge Withdrawals (Pending ones show in Purchase / Debits)
  for (const w of withdrawals) {
    if (processedDepositIds.has(String(w._id))) continue;
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
      id: w._id,
      orderCode: w._id.slice(-8).toUpperCase(),
      date: `${dateFormatted} ${timeFormatted}`.trim(),
      amount: Number(w.amount),
      currency: '₹',
      status: statusLabel,
      method: 'BANK WITHDRAWAL',
      fee: 0,
      description: isPending
        ? `Withdrawal to ${w.bankDetails?.upiId || 'UPI'} (Under Review)`
        : `Withdrawal Settled to ${w.bankDetails?.upiId || 'UPI'}`,
      terminalId: `WTH-${w._id.slice(-4).toUpperCase()}`,
      type: 'purchase',
    };
    (item as any).rawDate = w.createdAt;
    purchaseList.push(item);
  }

  const sortByDate = (a: any, b: any) => {
    const tA = new Date(a.rawDate).getTime();
    const tB = new Date(b.rawDate).getTime();
    return (isNaN(tB) ? 0 : tB) - (isNaN(tA) ? 0 : tA);
  };

  receiveList.sort(sortByDate);
  purchaseList.sort(sortByDate);

  return { receive: receiveList, purchase: purchaseList };
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
    { id: 'receive' as const, label: 'Receive (Credits)' },
    { id: 'purchase' as const, label: 'Purchase (Debits)' },
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
                    ? 'No incoming credits or rewards found in your account.'
                    : 'No outgoing purchases or withdrawals found in your account.'}
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
