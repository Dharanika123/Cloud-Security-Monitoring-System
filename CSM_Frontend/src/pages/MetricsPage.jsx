import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { CustomLoader } from '../components/CustomLoader';

export const MetricsPage = () => {
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);

  const fetchMetrics = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const res = await API.get('/api/metrics');
      setMetrics(res.data);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('Metrics error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(false);
    const interval = setInterval(() => fetchMetrics(true), 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <CustomLoader message="Fetching Performance Telemetry..." />;

  const avgCpu = metrics.length > 0 ? Math.round(metrics.reduce((acc, m) => acc + (m.cpuUsage || 0), 0) / metrics.length) : 0;
  const avgMemory = metrics.length > 0 ? Math.round(metrics.reduce((acc, m) => acc + (m.memoryUsage || 0), 0) / metrics.length) : 0;
  const avgDisk = metrics.length > 0 ? Math.round(metrics.reduce((acc, m) => acc + (m.diskUsage || 0), 0) / metrics.length) : 0;
  const avgNetwork = metrics.length > 0 ? Math.round((metrics.reduce((acc, m) => acc + (m.networkUsage || 0), 0) / metrics.length) * 10) / 10 : 0;

  return (
    <div className="page-container">
      <h2 style={{ marginBottom: '20px', color: '#fff' }}>Infrastructure Telemetry & Performance Metrics</h2>

      {/* METRIC SUMMARY CARDS */}
      <div className="dashboard-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card">
          <div className="stat-title">Fleet Avg CPU</div>
          <div className="stat-value" style={{ color: avgCpu > 80 ? '#f5222d' : avgCpu > 50 ? '#fa8c16' : '#10B981' }}>{avgCpu}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Fleet Avg Memory</div>
          <div className="stat-value" style={{ color: avgMemory > 80 ? '#f5222d' : '#10B981' }}>{avgMemory}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Fleet Avg Disk</div>
          <div className="stat-value" style={{ color: avgDisk > 80 ? '#f5222d' : '#3B82F6' }}>{avgDisk}%</div>
        </div>
        <div className="stat-card">
          <div className="stat-title">Fleet Avg Network</div>
          <div className="stat-value" style={{ color: 'var(--CSMS-blue)' }}>{avgNetwork} MB/s</div>
        </div>
      </div>

      <div className="table-panel">
        <h4 style={{ padding: '16px', color: 'var(--CSMS-text-muted)', margin: 0 }}>Metrics Telemetry Stream</h4>
        <table className="custom-table">
          <thead>
            <tr>
              <th>Metric ID</th>
              <th>Asset ID</th>
              <th>CPU Usage</th>
              <th>Memory Usage</th>
              <th>Disk Usage</th>
              <th>Network Telemetry</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr key={m.metricId}>
                <td style={{ fontFamily: 'monospace' }}>{m.metricId}</td>
                <td style={{ fontFamily: 'monospace' }}>{m.assetId}</td>
                <td><span style={{ color: m.cpuUsage > 85 ? 'var(--CSMS-red)' : 'var(--CSMS-green)' }}>{m.cpuUsage}%</span></td>
                <td>{m.memoryUsage}%</td>
                <td>{m.diskUsage}%</td>
                <td>{m.networkUsage} MB/s</td>
                <td>{new Date(m.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};