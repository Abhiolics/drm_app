import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { Colors } from '../theme/colors';
import { CustomBottomNav, TabName } from '../components/CustomBottomNav';
import { HomeScreen } from '../screens/HomeScreen';
import { PaymentHistoryScreen } from '../screens/PaymentHistoryScreen';
import { PaymentDetailScreen } from '../screens/PaymentDetailScreen';
import { TaskRewardsScreen } from '../screens/TaskRewardsScreen';
import { TaskDetailScreen } from '../screens/TaskDetailScreen';
import { AssetsScreen } from '../screens/AssetsScreen';
import { TeamsScreen } from '../screens/TeamsScreen';
import { ServiceScreen } from '../screens/ServiceScreen';
import { DepositScreen } from '../screens/DepositScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { GiftRewardScreen } from '../screens/GiftRewardScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { PlansScreen } from '../screens/PlansScreen';
import { StatsScreen } from '../screens/StatsScreen';
import { WithdrawalScreen } from '../screens/WithdrawalScreen';
import { PaymentItem, TaskItem, OfferItem } from '../types';

import { AuthProvider, useAuth } from '../context/AuthContext';

export type RootStackParamList = {
  MainTabs: undefined;
  PaymentDetail: { item?: PaymentItem };
  TaskDetail: { task?: TaskItem };
  Teams: undefined;
  Service: undefined;
  Deposit: { offer?: OfferItem };
  Account: undefined;
  GiftReward: undefined;
  Withdrawal: undefined;
};

function MainTabsScreen({
  currentTab,
  onSelectTab,
  onNavigateToDetail,
  onNavigateToTask,
  onNavigateToTeams,
  onNavigateToService,
  onNavigateToDeposit,
  onNavigateToAccount,
  onNavigateToGiftReward,
  onNavigateToWithdraw,
  onLogout,
}: {
  currentTab: TabName;
  onSelectTab: (tab: TabName) => void;
  onNavigateToDetail: (item?: PaymentItem) => void;
  onNavigateToTask: (task?: TaskItem) => void;
  onNavigateToTeams: () => void;
  onNavigateToService: () => void;
  onNavigateToDeposit: (offer?: OfferItem) => void;
  onNavigateToAccount: () => void;
  onNavigateToGiftReward: () => void;
  onNavigateToWithdraw: () => void;
  onLogout: () => void;
}) {
  const renderScreen = () => {
    switch (currentTab) {
      case 'Home':
        return (
          <HomeScreen
            onNavigateToPayments={() => onSelectTab('Payments')}
            onNavigateToStats={() => onSelectTab('Stats')}
            onNavigateToTasks={() => onSelectTab('Tasks')}
            onNavigateToAssets={() => onSelectTab('Assets')}
            onNavigateToTeams={onNavigateToTeams}
            onNavigateToPlans={() => onSelectTab('Plan')}
          />
        );
      case 'Plan':
        return (
          <PlansScreen
            onBack={() => onSelectTab('Home')}
            onNavigateToDeposit={onNavigateToDeposit}
            showBack={false}
          />
        );
      case 'Payments':
        return (
          <PaymentHistoryScreen
            onBack={() => onSelectTab('Home')}
            showBack={false}
          />
        );
      case 'Tasks':
        return (
          <TaskRewardsScreen
            onBack={() => onSelectTab('Home')}
            showBack={true}
          />
        );
      case 'Account':
        return (
          <AccountScreen
            onBack={() => onSelectTab('Home')}
          />
        );
      case 'Stats':
        return (
          <StatsScreen
            onBack={() => onSelectTab('Home')}
            onNavigateToDeposit={onNavigateToDeposit}
            showBack={false}
          />
        );
      case 'Assets':
        return (
          <AssetsScreen
            onBack={() => onSelectTab('Home')}
            onNavigateToHome={() => onSelectTab('Home')}
            onNavigateToService={onNavigateToService}
            onNavigateToGiftReward={onNavigateToGiftReward}
            onNavigateToDeposit={() => onNavigateToDeposit()}
            onNavigateToWithdraw={onNavigateToWithdraw}
            onNavigateToHistory={() => onSelectTab('Payments')}
            onLogout={onLogout}
            showBack={false}
          />
        );
      default:
        return <HomeScreen />;
    }
  };

  return (
    <View style={styles.tabWrapper}>
      {renderScreen()}
      <CustomBottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'Account') {
            onNavigateToAccount();
          } else {
            onSelectTab(tab);
          }
        }}
      />
    </View>
  );
}

const AppNavigatorInner: React.FC = () => {
  const { isLoggedIn, isLoading, logout, refreshUser } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [currentTab, setCurrentTab] = useState<TabName>('Home');
  const [activePaymentItem, setActivePaymentItem] = useState<PaymentItem | undefined>();
  const [activeTaskItem, setActiveTaskItem] = useState<TaskItem | undefined>();
  const [activeOffer, setActiveOffer] = useState<OfferItem | undefined>();
  const [currentStackRoute, setCurrentStackRoute] = useState<
    'Tabs' | 'PaymentDetail' | 'TaskDetail' | 'Teams' | 'Service' | 'Deposit' | 'Account' | 'GiftReward' | 'Withdrawal'
  >('Tabs');

  if (showSplash || isLoading) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLoginSuccess={async () => {
          await refreshUser();
          setCurrentTab('Home');
          setCurrentStackRoute('Tabs');
        }}
      />
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: false,
        colors: {
          primary: Colors.primary,
          background: Colors.background,
          card: Colors.surface,
          text: Colors.textPrimary,
          border: Colors.border,
          notification: Colors.danger,
        },
        fonts: {
          regular: { fontFamily: 'System', fontWeight: '400' },
          medium: { fontFamily: 'System', fontWeight: '500' },
          bold: { fontFamily: 'System', fontWeight: '700' },
          heavy: { fontFamily: 'System', fontWeight: '800' },
        },
      }}
    >
      <View style={styles.container}>
        {currentStackRoute === 'Tabs' && (
          <MainTabsScreen
            currentTab={currentTab}
            onSelectTab={(tab) => setCurrentTab(tab)}
            onNavigateToDetail={(item) => {
              setActivePaymentItem(item);
              setCurrentStackRoute('PaymentDetail');
            }}
            onNavigateToTask={(task) => {
              setActiveTaskItem(task);
              setCurrentStackRoute('TaskDetail');
            }}
            onNavigateToTeams={() => {
              setCurrentStackRoute('Teams');
            }}
            onNavigateToService={() => {
              setCurrentStackRoute('Service');
            }}
            onNavigateToDeposit={(offer) => {
              setActiveOffer(offer);
              setCurrentStackRoute('Deposit');
            }}
            onNavigateToAccount={() => {
              setCurrentStackRoute('Account');
            }}
            onNavigateToGiftReward={() => {
              setCurrentStackRoute('GiftReward');
            }}
            onNavigateToWithdraw={() => {
              setCurrentStackRoute('Withdrawal');
            }}
            onLogout={async () => {
              await logout();
              setCurrentTab('Home');
              setCurrentStackRoute('Tabs');
            }}
          />
        )}

        {currentStackRoute === 'PaymentDetail' && (
          <PaymentDetailScreen
            onBack={() => setCurrentStackRoute('Tabs')}
            paymentItem={activePaymentItem}
          />
        )}

        {currentStackRoute === 'TaskDetail' && (
          <TaskDetailScreen
            onBack={() => setCurrentStackRoute('Tabs')}
            taskItem={activeTaskItem}
          />
        )}

        {currentStackRoute === 'Teams' && (
          <TeamsScreen
            onBack={() => setCurrentStackRoute('Tabs')}
          />
        )}

        {currentStackRoute === 'Service' && (
          <ServiceScreen
            onBack={() => setCurrentStackRoute('Tabs')}
          />
        )}

        {currentStackRoute === 'Deposit' && (
          <DepositScreen
            onBack={() => setCurrentStackRoute('Tabs')}
            offer={activeOffer}
          />
        )}

        {currentStackRoute === 'Account' && (
          <AccountScreen
            onBack={() => setCurrentStackRoute('Tabs')}
          />
        )}

        {currentStackRoute === 'GiftReward' && (
          <GiftRewardScreen
            onBack={() => setCurrentStackRoute('Tabs')}
          />
        )}

        {currentStackRoute === 'Withdrawal' && (
          <WithdrawalScreen
            onBack={() => setCurrentStackRoute('Tabs')}
          />
        )}
      </View>
    </NavigationContainer>
  );
};

export const AppNavigator: React.FC = () => {
  return (
    <AuthProvider>
      <AppNavigatorInner />
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabWrapper: {
    flex: 1,
  },
});

