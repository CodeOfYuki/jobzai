import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Loader2, Sparkles, X } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '€0',
    credits: 25,
    description: 'Perfect for trying out the basics of Jobz.ai',
    features: [
      '25 Credits / month',
      'Access to Basic Job Application Templates',
      'AI-Powered Cover Letter Assistance',
      'Application Tracking Dashboard',
      'Standard Email Support',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '€39',
    credits: 500,
    description: 'Ideal for regular job seekers who need more credits.',
    features: [
      '500 Credits / month',
      'All Free Features, plus:',
      'Automated Campaigns for targeted job applications',
      'Basic Analytics (open rates, response rates)',
      'AI-Generated Personalized Content',
      'Priority Support',
    ],
    mostPopular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '€69',
    credits: 999999,
    description: 'Designed for power users needing high-volume applications.',
    features: [
      'Unlimited Credits',
      'Premium AI Templates',
      'Advanced Analytics Dashboard',
      'Custom Integration Options',
      'Priority Support 24/7',
      'Team Collaboration Tools',
      'API Access',
    ],
  },
];

export default function PlanSelectionPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handlePlanSelect = async (planId: string) => {
    if (!currentUser) {
      toast.error('Please sign in to select a plan');
      return;
    }

    setSelectedPlan(planId);
    setIsLoading(true);

    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan) throw new Error('Invalid plan selected');

      // Update user's credits and plan in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        plan: planId,
        credits: plan.credits,
        planSelectedAt: new Date().toISOString()
      });

      toast.success(`${plan.name} plan activated successfully!`);

      // If it's a paid plan, redirect to payment
      if (planId !== 'free') {
        navigate('/payment', { 
          state: { 
            type: 'plan',
            plan: {
              id: plan.id,
              name: plan.name,
              price: plan.price,
              credits: plan.credits
            }
          }
        });
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error selecting plan:', error);
      toast.error('Failed to select plan. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Close Button */}
        <div className="absolute top-4 right-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-white shadow-md hover:bg-gray-50 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-gray-900"
          >
            Choose Your Plan
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-4 text-lg text-gray-600"
          >
            Select the plan that best fits your job search needs
          </motion.p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.2 }}
              className={`relative flex flex-col h-full bg-white rounded-2xl shadow-sm ${
                plan.mostPopular ? 'ring-2 ring-[#8D75E6]' : ''
              }`}
            >
              {plan.mostPopular && (
                <div className="absolute -top-5 inset-x-0 flex justify-center">
                  <div className="inline-flex items-center px-4 py-1 rounded-full text-sm bg-[#8D75E6] text-white shadow-sm">
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-6 flex-grow">
                <h3 className="text-xl font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-2 text-sm text-gray-500">{plan.description}</p>
                
                <div className="mt-4 flex items-baseline">
                  <span className="text-3xl font-bold tracking-tight text-gray-900">
                    {plan.price}
                  </span>
                  {plan.price !== '€0' && (
                    <span className="text-sm text-gray-500 ml-1">/month</span>
                  )}
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start">
                      <Check className="h-5 w-5 text-[#8D75E6] shrink-0" />
                      <span className="ml-3 text-sm text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 bg-gray-50 rounded-b-2xl">
                <button
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={isLoading && selectedPlan === plan.id}
                  className={`w-full py-3 px-4 rounded-lg font-semibold text-center transition-colors ${
                    plan.mostPopular
                      ? 'bg-[#8D75E6] text-white hover:bg-[#7B65D4]'
                      : 'bg-gray-900 text-white hover:bg-gray-800'
                  }`}
                >
                  {isLoading && selectedPlan === plan.id ? (
                    <div className="flex items-center justify-center">
                      <Loader2 className="animate-spin h-5 w-5 mr-2" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <span>{plan.price === '€0' ? 'Start Free' : 'Get Started'}</span>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}