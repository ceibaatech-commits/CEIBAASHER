import React from 'react';
import { RefreshCw } from 'lucide-react';

import { useLiveBattles } from './live-battles/useLiveBattles';
import { LiveBattlesStats } from './live-battles/LiveBattlesStats';
import { LiveBattlesTabs } from './live-battles/LiveBattlesTabs';
import { LiveBattlesList } from './live-battles/LiveBattlesList';
import { ReportsList } from './live-battles/ReportsList';
import { BattleHistoryTable } from './live-battles/BattleHistoryTable';
import { ReportDetailModal } from './live-battles/ReportDetailModal';
import { BattleDetailModal } from './live-battles/BattleDetailModal';

const LiveBattlesManager = () => {
  const {
    liveBattles, battleHistory, reports, filteredReports, stats, loading,
    activeTab, setActiveTab,
    selectedBattle, setSelectedBattle,
    selectedReport, setSelectedReport,
    filterStatus, setFilterStatus,
    fetchLiveBattles, handleTerminateBattle, handleReviewReport,
  } = useLiveBattles();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64" data-testid="live-battles-loading">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const pendingReportsCount = reports.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6" data-testid="live-battles-manager-root">
      <LiveBattlesStats stats={stats} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <LiveBattlesTabs
          activeTab={activeTab} setActiveTab={setActiveTab}
          liveCount={liveBattles.length} pendingReportsCount={pendingReportsCount}
        />
        <div className="p-6">
          {activeTab === 'live' && (
            <LiveBattlesList
              battles={liveBattles}
              onView={setSelectedBattle}
              onTerminate={handleTerminateBattle}
              onRefresh={fetchLiveBattles}
            />
          )}
          {activeTab === 'reports' && (
            <ReportsList
              reports={reports}
              filteredReports={filteredReports}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              onSelect={setSelectedReport}
            />
          )}
          {activeTab === 'history' && (
            <BattleHistoryTable
              history={battleHistory}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
            />
          )}
        </div>
      </div>

      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onReview={handleReviewReport}
      />
      <BattleDetailModal
        battle={selectedBattle}
        onClose={() => setSelectedBattle(null)}
        onTerminate={handleTerminateBattle}
      />
    </div>
  );
};

export default LiveBattlesManager;
