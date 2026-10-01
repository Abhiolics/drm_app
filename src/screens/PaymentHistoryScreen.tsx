import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Header } from '../components/Header';
import { TabSelector } from '../components/TabSelector';
import { PaymentCard } from '../components/PaymentCard';
import { PaymentDetailModal } from '../components/PaymentDetailModal';
import { useBottomNavPadding } from '../components/CustomBottomNav';
import { mockReceivePayments, mockPurchasePayments } from '../data/mockData';
import { PaymentItem } from '../types';
import { Colors } from '../theme/colors';
import { Spacing } from '../theme/spacing';

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
  const bottomNavPadding = useBottomNavPadding();

  const tabs = [
    { id: 'receive' as const, label: 'Receive' },
    { id: 'purchase' as const, label: 'Purchase' },
  ];

  const currentList =
    activeTab === 'receive' ? mockReceivePayments : mockPurchasePayments;

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

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomNavPadding }]}
        >
          {currentList.map((payment) => (
            <PaymentCard
              key={payment.id}
              payment={payment}
              onPress={(item) => setSelectedPayment(item)}
            />
          ))}
        </ScrollView>
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
  },
});
