import React from 'react';

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-gray-900">Study Tracker Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Track your learning progress here.</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 font-semibold">Total Hours</h3>
              <p className="text-4xl font-bold text-blue-600 mt-2">42</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 font-semibold">Subjects</h3>
              <p className="text-4xl font-bold text-green-600 mt-2">5</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 font-semibold">Streak Days</h3>
              <p className="text-4xl font-bold text-purple-600 mt-2">12</p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-gray-600 font-semibold">Completed Tasks</h3>
              <p className="text-4xl font-bold text-orange-600 mt-2">28</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <ul className="space-y-3">
            <li className="text-gray-700 py-2 border-b border-gray-200">Mathematics - 2 hours</li>
            <li className="text-gray-700 py-2 border-b border-gray-200">Physics - 1.5 hours</li>
            <li className="text-gray-700 py-2">English - 1 hour</li>
          </ul>
        </section>

        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-4">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition">Start Study Session</button>
            <button className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-lg transition">Add Subject</button>
            <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition">View Report</button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Dashboard;