import AffinityCard from './components/AffinityCard'
import ChallengeCard from './components/ChallengeCard'
import CommunityPicks from './components/CommunityPicks'
import Header from './components/Header'
import HeroBanner from './components/HeroBanner'
import RecommendationsCarousel from './components/RecommendationsCarousel'
import Sidebar from './components/Sidebar'

function App() {
  return (
    <div className="bg-background font-body-md text-on-surface antialiased min-h-screen">
      <Header />
      <Sidebar activePath="recomendaciones-ia" />

      <div className="pl-64">
        <main className="w-full pt-16 px-gutter pb-space-xl bg-background min-h-screen">
          <div className="flex flex-col w-full">
            <HeroBanner />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-xl">
              <AffinityCard />
              <ChallengeCard />
            </div>

            <RecommendationsCarousel />

            <CommunityPicks />
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
