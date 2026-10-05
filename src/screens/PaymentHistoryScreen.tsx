import React, { useState, useEffect, useCallback } from 'react';
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
import { ApiTransaction, PaymentItem } from '../types';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';
import { Typography } from '../theme/typography';

interface PaymentHistoryScreenProps {
  onBack?: () => void;
  showBack?: boolean;
}

export const PaymentHistoryScreen: React.FC<PaymentHistoryScreenProps> = ({
  onBack,
  showBack = false,
}) => {
  const [activeTab, setActiveTab] = useState<'receive' | 'purchase'>('receive');
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [transactions, setTransactions] = useState<ApiTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const bottomNavPadding = useBottomNavPadding();

  const tabs = [
    { id: 'receive' as const, label: 'Receive (Credits)' },
    { id: 'purchase' as const, label: 'Purchase (Debits)' },
  ];

  useEffect(() => {
    let isCancelled = false;
    walletService.getTransactions({ limit: 50 }).then((res) => {
      if (isCancelled) return;
      if (res?.transactions) {
        setTransactions(res.transactions);
      }
      setIsLoading(false);
    }).catch(() => {
      if (!isCancelled) setIsLoading(false);
    });
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await walletService.getTransactions({ limit: 50 });
      if (res?.transactions) {
        setTransactions(res.transactions);
      }
    } catch (error) {
      console.warn('Failed to load transaction history:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Map ApiTransaction to PaymentItem
  const mapToPaymentItem = (tx: ApiTransaction): PaymentItem => {
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

    const statusLabel: 'New' | 'Completed' | 'Processing' =
      tx.status === 'completed'
        ? 'Completed'
        : tx.status === 'pending'
        ? 'Processing'
        : 'New';

    return {
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
      type: tx.type === 'credit' ? 'receive' : 'purchase',
    };
  };

  const filteredTransactions = transactions.filter((tx) =>
    activeTab === 'receive' ? tx.type === 'credit' : tx.type === 'debit'
  );

  const paymentItems: PaymentItem[] = filteredTransactions.map(mapToPaymentItem);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar style="light" />

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
