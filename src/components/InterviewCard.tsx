
export default function InterviewCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-shadow">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-black-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15 8a3 3 0 11-6 0 3 3 0 016 0zM20 10a2 2 0 11-4 0 2 2 0 014 0zM16 17a4 4 0 00-8 0v3h8v-3zM8 10a2 2 0 11-4 0 2 2 0 014 0zM18 20v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0121 17v3h-3zM6.75 14.094A5.973 5.973 0 006 17v3H3v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Interview for UI/UX Designer</h3>
            </div>
          </div>
        </div>

        {/* Video Interface */}
        <div className="relative aspect-video bg-black-900 rounded-xl mb-6 overflow-hidden group">
          <div className="absolute inset-0">
            <iframe
              className="w-full h-full"
              src="https://www.youtube.com/embed/k3ZItY0S57k?si=jjW91WHpEiSsG4KH"
              title="Product demo"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>

        {/* Score Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-purple-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">80%</div>
            <div className="text-sm font-medium text-purple-900">AI Video Score</div>
          </div>
          <div className="bg-orange-50 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">75%</div>
            <div className="text-sm font-medium text-orange-900">Response Score</div>
          </div>
        </div>
      </div>
    </div>
  );
}
