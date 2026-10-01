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
import { StatsScreen } from '../screens/StatsScreen';
import { AssetsScreen } from '../screens/AssetsScreen';
import { TeamsScreen } from '../screens/TeamsScreen';
import { ServiceScreen } from '../screens/ServiceScreen';
import { DepositScreen } from '../screens/DepositScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { PaymentItem, TaskItem, OfferItem } from '../types';

export type RootStackParamList = {
  MainTabs: undefined;
  PaymentDetail: { item?: PaymentItem };
  TaskDetail: { task?: TaskItem };
  Teams: undefined;
  Service: undefined;
  Deposit: { offer?: OfferItem };
};

function MainTabsScreen({
  currentTab,
  onSelectTab,
  onNavigateToDetail,
  onNavigateToTask,
  onNavigateToTeams,
  onNavigateToService,
  onNavigateToDeposit,
  onLogout,
}: {
  currentTab: TabName;
  onSelectTab: (tab: TabName) => void;
  onNavigateToDetail: (item?: PaymentItem) => void;
  onNavigateToTask: (task?: TaskItem) => void;
  onNavigateToTeams: () => void;
  onNavigateToService: () => void;
  onNavigateToDeposit: (offer?: OfferItem) => void;
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
            showBack={false}
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
      <CustomBottomNav currentTab={currentTab} onSelectTab={onSelectTab} />
    </View>
  );
}

export const AppNavigator: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabName>('Home');
  const [activePaymentItem, setActivePaymentItem] = useState<PaymentItem | undefined>();
  const [activeTaskItem, setActiveTaskItem] = useState<TaskItem | undefined>();
  const [activeOffer, setActiveOffer] = useState<OfferItem | undefined>();
  const [currentStackRoute, setCurrentStackRoute] = useState<
    'Tabs' | 'PaymentDetail' | 'TaskDetail' | 'Teams' | 'Service' | 'Deposit'
  >('Tabs');

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (!isLoggedIn) {
    return (
      <LoginScreen
        onLoginSuccess={() => {
          setIsLoggedIn(true);
          setCurrentTab('Home');
          setCurrentStackRoute('Tabs');
        }}
      />
    );
  }

  return (
    <NavigationContainer
      theme={{
        dark: true,
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
            onLogout={() => {
              setIsLoggedIn(false);
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
      </View>
    </NavigationContainer>
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
