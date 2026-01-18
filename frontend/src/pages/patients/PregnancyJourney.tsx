import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import pregnancyTrackingService, { PregnancyJourney } from '../../services/pregnancy-tracking.service';
import { FiHeart, FiCalendar, FiCheckCircle, FiClock, FiActivity } from 'react-icons/fi';

const PregnancyJourneyPage: React.FC = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const [journey, setJourney] = useState<PregnancyJourney | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      loadPregnancyJourney();
    }
  }, [patientId]);

  const loadPregnancyJourney = async () => {
    try {
      setLoading(true);
      const data = await pregnancyTrackingService.getPregnancyJourney(patientId!);
      setJourney(data);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load pregnancy journey');
      navigate(`/patients/${patientId}`);
    } finally {
      setLoading(false);
    }
  };

  const getTrimesterColor = (trimester: number) => {
    switch (trimester) {
      case 1: return 'bg-pink-100 text-pink-800';
      case 2: return 'bg-purple-100 text-purple-800';
      case 3: return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = () => {
    if (!journey) return 0;
    return Math.min((journey.current_week / 40) * 100, 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading pregnancy journey...</div>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">No pregnancy data available</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Pregnancy Journey</h1>
          <p className="text-gray-600 mt-1">{journey.patient_name}</p>
        </div>
        <button
          onClick={() => navigate(`/patients/${patientId}`)}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          ← Back to Patient
        </button>
      </div>

      {/* Current Status Overview */}
      <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg shadow-lg p-6 text-white mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <FiActivity className="w-8 h-8 mx-auto mb-2" />
            <div className="text-3xl font-bold">{journey.current_week}</div>
            <div className="text-sm opacity-90">Weeks + {journey.current_day} days</div>
          </div>
          <div className="text-center">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTrimesterColor(journey.trimester)} inline-block mb-2`}>
              Trimester {journey.trimester}
            </span>
            <div className="text-sm opacity-90 mt-2">Current Phase</div>
          </div>
          <div className="text-center">
            <FiCalendar className="w-8 h-8 mx-auto mb-2" />
            <div className="font-semibold">{formatDate(journey.edd)}</div>
            <div className="text-sm opacity-90">Expected Delivery</div>
          </div>
          <div className="text-center">
            <FiHeart className="w-8 h-8 mx-auto mb-2" />
            <div className="font-semibold">
              G{journey.gravida || 0} P{journey.para || 0} A{journey.abortion || 0} L{journey.living || 0}
            </div>
            <div className="text-sm opacity-90">Obstetric History</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Journey Progress</span>
            <span>{Math.round(getProgressPercentage())}%</span>
          </div>
          <div className="w-full bg-white bg-opacity-30 rounded-full h-3">
            <div
              className="bg-white h-3 rounded-full transition-all duration-500"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Week Info */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FiClock className="mr-2" />
              {journey.current_week_info.title}
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">👶 Baby's Development</h3>
                <p className="text-gray-600">{journey.current_week_info.baby_development}</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">👩 What You Might Be Experiencing</h3>
                <p className="text-gray-600">{journey.current_week_info.mother_changes}</p>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">💡 Tips for This Week</h3>
                <ul className="list-disc list-inside space-y-1">
                  {journey.current_week_info.tips.map((tip, index) => (
                    <li key={index} className="text-gray-600">{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Completed Weeks Timeline */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <FiCheckCircle className="mr-2" />
              Milestones Achieved
            </h2>

            <div className="space-y-4">
              {journey.weeks_completed.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  Journey just beginning. First milestone at week 4!
                </p>
              ) : (
                journey.weeks_completed.map((week) => (
                  <div key={week.week} className="border-l-4 border-green-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getTrimesterColor(week.trimester)} mr-2`}>
                            Week {week.week}
                          </span>
                          <h3 className="font-semibold text-gray-800">{week.title}</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{week.baby_development}</p>
                        {week.checkup_notes && (
                          <div className="bg-blue-50 border border-blue-200 rounded p-2 mt-2">
                            <p className="text-sm text-blue-800">
                              <strong>Checkup Notes:</strong> {week.checkup_notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar - Upcoming Milestones */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming Milestones</h2>
            <ul className="space-y-3">
              {journey.upcoming_milestones.map((milestone, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-medium mr-3 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-gray-700 text-sm">{milestone}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-700 mb-3">Key Dates</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">LMP:</span>
                  <span className="font-medium">{formatDate(journey.lmp)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">EDD:</span>
                  <span className="font-medium">{formatDate(journey.edd)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Days to go:</span>
                  <span className="font-medium">
                    {Math.max(0, Math.ceil((new Date(journey.edd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PregnancyJourneyPage;
