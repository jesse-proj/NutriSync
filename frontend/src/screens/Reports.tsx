import {
  Download,
  TrendingDown,
  CheckCircle
} from 'lucide-react'
import { ScrollArea, ScrollBar } from '../components/ui/scroll-area'
import Footer from '../components/Footer'
import PatientNavbar from '../components/PatientNavbar'
import { Button } from '@/components/ui/button'

// ponytail: Reports.tsx uses simple native SVG and Tailwind divs for charts to keep it minimal and dependency-free

const Reports = () => {

  const weeklyData = [
    { day: 'Mon', calories: 85, sodium: 70 },
    { day: 'Tue', calories: 95, sodium: 60 },
    { day: 'Wed', calories: 75, sodium: 40 },
    { day: 'Thu', calories: 80, sodium: 85 },
    { day: 'Fri', calories: 60, sodium: 50 },
    { day: 'Sat', calories: 90, sodium: 95 },
    { day: 'Sun', calories: 55, sodium: 45 },
  ]

  const topDishes = [
    {
      name: 'Sinigang na Bangus',
      kcal: 320,
      sodium: 480,
      count: 4,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDU0WCHoFSvJk7yjsgrXVvBiJQUOnliLQ_-h4dOYGZnm4JfKrswwvozJKvOkGjih9_FnM39K6S3L0qdkOHG2R5Wc4h6XKZnMMh1RptB1LTuAw7cJHHeQ1VLSuJpPVteVaMbJ1z93-gqkePrxUzng4HD1Tkqi4YE8s8mQIcqkyEBwM4_G_29DEHu1CRn-vK8j-mmvbxJrq_xoQ2ag0hfymux9Ct34bt_0W2OfpFPBSGsvRCCkU_nOaiTzw9k9icP0azStVMWfl9VyQ'
    },
    {
      name: 'Ginisang Pinakbet',
      kcal: 180,
      sodium: 350,
      count: 3,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApFj4jansD-rX9ZvCPw_W2rbsV48s_CR9apKn5MpjiMx68XmaU-aDzTSKSAXTJybVlANNkt73dHAOIpRkpwRrfvkV1c9qfru6yK_uUJSkNnN0SQ0jB21FyGwOa5Dw5zpvrthlWCTUNT4DsFysrnYnD5ZYXa6K2HGwuyrppFFCPquBGd3Wg95PiIf_cII_GfI6dk7fnf17Kop1Ohz5jJY1oUOtpnnDR0F87mOibN9Ah79v4dsq439ycVqwQ9tNvYnL97iGn92uRIA'
    },
    {
      name: 'Grilled Chicken & Rice',
      kcal: 450,
      sodium: 210,
      count: 2,
      image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4CtALdKbJQY5eO1UlljM027liXiCOjcc2-NwCOEMRsaPWC3Y5OYaFGSj5I-M1i6uAwXcCa9jy_QCNCHyQQcqd2OJ3jIJYLUeA0B5_KqZ_faORMmbbYPMzjU2LzFvtBSHoYSraMi6fIARxpmJ1PuZ0kwZdZ_LFfU9ma6XIA0c6ztIaWQYuexZ3mVd9Ue86eU6dsEecY7K9J0GEDzTeVu3Yhf0JmGhdmxm9CBA_WgDy6bcf6uc6c9brCdxH-5k4JDfILfbDptpNow'
    }
  ]

  return (
    <div className="min-h-screen bg-background text-on-surface flex flex-col font-sans relative">
      <PatientNavbar activePage="reports" />

      {/* Main Content */}
      <ScrollArea className="flex-grow w-full">
        <main className="max-w-7xl mx-auto w-full px-6 py-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-on-surface tracking-tight">Nutritional Analysis</h1>
              <p className="text-sm text-on-surface-variant mt-1.5">Reviewing your health trends for the past week</p>
            </div>
            <Button className="bg-primary text-on-primary px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg hover:bg-primary-container transition-all">
              <Download className="h-4 w-4" />
              Export Full Report
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Content (8 Columns) */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              {/* Weekly Summary & Chart */}
              <section className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-on-surface">Weekly Summary</h3>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-primary"></span>
                      <span className="text-xs font-semibold text-on-surface-variant">Calories</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-secondary"></span>
                      <span className="text-xs font-semibold text-on-surface-variant">Sodium</span>
                    </div>
                  </div>
                </div>

                {/* Bar Chart */}
                <div className="h-64 flex items-end justify-between gap-4 mt-8 px-4 border-b border-outline-variant/50 pb-4">
                  {weeklyData.map((data, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                      <div className="w-full flex justify-center items-end gap-1 h-[80%]">
                        <div
                          className="w-4 rounded-t-sm transition-all duration-500 bg-primary"
                          style={{ height: `${data.calories}%` }}
                          title={`Calories: ${data.calories}%`}
                        ></div>
                        <div
                          className="w-4 rounded-t-sm transition-all duration-500 bg-secondary"
                          style={{ height: `${data.sodium}%` }}
                          title={`Sodium: ${data.sodium}%`}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-on-surface-variant">{data.day}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Nutritional Insights */}
              <section className="flex flex-col gap-4">
                <h3 className="text-lg font-bold text-on-surface">Nutritional Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Sodium Card */}
                  <div className="bg-surface-container-low p-6 rounded-2xl border border-secondary-container flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary">
                        <TrendingDown className="h-6 w-6" />
                      </div>
                      <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold">
                        Improving
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-secondary">Sodium Reduction</h4>
                      <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                        Your sodium intake is down 12% from last week. Great job avoiding processed broths!
                      </p>
                    </div>
                  </div>

                  {/* Potassium Card */}
                  <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant/30 flex flex-col gap-4 shadow-sm">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                        <CheckCircle className="h-6 w-6" />
                      </div>
                      <span className="bg-surface-variant text-on-surface-variant px-3 py-1 rounded-full text-xs font-bold">
                        On Track
                      </span>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-on-surface">Potassium Intake</h4>
                      <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                        Maintaining steady levels at 3,200mg avg. Continue including bananas and spinach.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Clinical Outlook */}
              <section className="bg-on-surface text-background p-8 rounded-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="text-lg font-bold mb-2">Clinical Outlook</h3>
                  <p className="text-sm opacity-90 max-w-xl leading-relaxed">
                    Your recent dietary changes are positively impacting your fluid retention markers. Continue this regimen for the next 14 days before your consultation.
                  </p>
                </div>
                <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl"></div>
              </section>
            </div>

            {/* Sidebar (4 Columns) */}
            <aside className="lg:col-span-4 flex flex-col gap-8">
              {/* Top Logged Dishes */}
              <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-outline-variant/30">
                <h3 className="text-lg font-bold text-on-surface mb-6">Top Logged Dishes</h3>
                <div className="flex flex-col gap-4">
                  {topDishes.map((dish, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-container transition-all border border-transparent hover:border-outline-variant">
                      <div className="w-16 h-16 rounded-xl bg-surface-container-high shrink-0 overflow-hidden">
                        <img className="w-full h-full object-cover" alt={dish.name} src={dish.image} />
                      </div>
                      <div className="flex-grow text-left">
                        <h4 className="text-sm font-bold text-on-surface">{dish.name}</h4>
                        <p className="text-xs text-on-surface-variant mt-0.5">{dish.kcal} kcal • {dish.sodium}mg Sodium</p>
                      </div>
                      <div className="text-primary font-bold pr-2">{dish.count}x</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Monthly Progress */}
              <div className="bg-primary-container/10 p-6 rounded-2xl border border-primary-container/20">
                <h3 className="text-lg font-bold text-primary mb-4">Monthly Progress</h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-20 h-20">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path className="stroke-current text-primary/10" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeWidth="3"></path>
                      <path className="stroke-current text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" strokeDasharray="82, 100" strokeLinecap="round" strokeWidth="3"></path>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-primary font-extrabold text-lg">82%</div>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-on-surface">Goal Adherence</p>
                    <p className="text-xs text-on-surface-variant mt-0.5 font-medium">Top 5% of users this month</p>
                  </div>
                </div>
                <p className="text-sm text-on-surface-variant italic leading-relaxed text-left">
                  "Consistency is key, Juan. You've logged 28 days straight!"
                </p>
              </div>
            </aside>
          </div>
        </main>

        <Footer />
        <ScrollBar orientation="vertical" />
      </ScrollArea>
    </div>
  )
}

export default Reports
