import { useRef, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, StatusBar, useWindowDimensions, Alert
} from 'react-native';
import BottomNav from '../components/BottomNav';

const contractors = [
  { icon: '🏗️', name: 'RCC Work', bg: '#EBF5FB', category: 'RCC Work' },
  { icon: '🧱', name: 'Brickwork &\nPlaster', bg: '#EBF5FB', category: 'Brickwork & Plaster' },
  { icon: '🔧', name: 'Plumbing', bg: '#EBF5FB', category: 'Plumbing' },
  { icon: '⚡', name: 'Electrical', bg: '#EBF5FB', category: 'Electrical' },
  { icon: '🪨', name: 'Tiles & Stone\nFlooring', bg: '#EBF5FB', category: 'Tiles & Stone Flooring' },
  { icon: '🪟', name: 'Section\nWindows', bg: '#EBF5FB', category: 'Section Windows' },
  { icon: '🎨', name: 'Painters', bg: '#EBF5FB', category: 'Painters' },
  { icon: '🚪', name: 'Doors &\nFurniture', bg: '#EBF5FB', category: 'Doors & Furniture' },
  { icon: '🌿', name: 'Garden &\nLandscape', bg: '#EBF5FB', category: 'Garden & Landscape' },
];

const professionals = [
  { icon: '📐', name: 'Civil\nEngineer', category: 'Civil Engineer' },
  { icon: '👷', name: 'Site\nEngineer', category: 'Site Engineer' },
  { icon: '📋', name: 'Project\nEngineer', category: 'Project Engineer' },
  { icon: '🏗️', name: 'Structural\nEngineer', category: 'Structural Engineer' },
  { icon: '📅', name: 'Planning\nEngineer', category: 'Planning Engineer' },
  { icon: '📊', name: 'Quantity\nSurveyor', category: 'Quantity Surveyor' },
  { icon: '🏛️', name: 'Architect', category: 'Architect' },
  { icon: '🛋️', name: 'Interior\nDesigner', category: 'Interior Designer' },
  { icon: '🌿', name: 'Landscape\nDesigner', category: 'Landscape Designer' },
  { icon: '🖥️', name: '3D\nVisualizer', category: '3D Visualizer' },
  { icon: '📏', name: 'Draftsman\nAutoCAD', category: 'Draftsman AutoCAD' },
  { icon: '🦺', name: 'Site\nSupervisor', category: 'Site Supervisor' },
  { icon: '💼', name: 'Construction\nManager', category: 'Construction Manager' },
  { icon: '❄️', name: 'HVAC\nEngineer', category: 'HVAC Engineer' },
  { icon: '🔥', name: 'Fire Safety\nEngineer', category: 'Fire Safety Engineer' },
  { icon: '🔩', name: 'Structural\nConsultant', category: 'Structural Consultant' },
  { icon: '💰', name: 'Cost\nConsultant', category: 'Cost Consultant' },
  { icon: '🏢', name: 'PMC\nConsultant', category: 'PMC Consultant' },
  { icon: '⛑️', name: 'Safety\nOfficer', category: 'Safety Officer' },
  { icon: '🌱', name: 'Environmental\nConsultant', category: 'Environmental Consultant' },
  { icon: '💻', name: 'BIM\nModeler', category: 'BIM Modeler' },
  { icon: '🧮', name: 'Estimator', category: 'Estimator' },
  { icon: '📝', name: 'BOQ\nSpecialist', category: 'BOQ Specialist' },
  { icon: '🗺️', name: 'Land\nSurveyor', category: 'Land Surveyor' },
  { icon: '🤝', name: 'Liaisoning\nConsultant', category: 'Liaisoning Consultant' },
];

const companies = [
  { icon: '🏢', name: 'Builders &\nDevelopers', category: 'Builders & Developers' },
  { icon: '🔑', name: 'Turnkey\nContractors', category: 'Turnkey Contractors' },
  { icon: '⚙️', name: 'EPC\nContractors', category: 'EPC Contractors' },
  { icon: '🛣️', name: 'Infrastructure\nCompanies', category: 'Infrastructure Companies' },
  { icon: '🏘️', name: 'Real Estate\nCompanies', category: 'Real Estate Companies' },
  { icon: '📋', name: 'Construction\nPMC', category: 'Construction PMC' },
  { icon: '🧱', name: 'Precast\nCompanies', category: 'Precast Companies' },
  { icon: '⚓', name: 'Steel Structure\nCompanies', category: 'Steel Structure Companies' },
  { icon: '💧', name: 'Waterproofing\nCompanies', category: 'Waterproofing Companies' },
  { icon: '🪟', name: 'Facade\nCompanies', category: 'Facade Companies' },
  { icon: '🔌', name: 'MEP\nContractors', category: 'MEP Contractors' },
  { icon: '🪵', name: 'Formwork\nCompanies', category: 'Formwork Companies' },
  { icon: '🏗️', name: 'Scaffolding\nCompanies', category: 'Scaffolding Companies' },
  { icon: '💣', name: 'Demolition\nCompanies', category: 'Demolition Companies' },
  { icon: '🔬', name: 'Soil Testing\nCompanies', category: 'Soil Testing Companies' },
  { icon: '🗺️', name: 'Survey\nCompanies', category: 'Survey Companies' },
];

const rentals = [
  { icon: '🚜', name: 'JCB /\nExcavator', category: 'JCB / Excavator' },
  { icon: '🏗️', name: 'Crane Tower /\nMobile', category: 'Crane Tower / Mobile' },
  { icon: '🚧', name: 'Bulldozer', category: 'Bulldozer' },
  { icon: '🛞', name: 'Road\nRoller', category: 'Road Roller' },
  { icon: '🔄', name: 'Concrete\nMixer', category: 'Concrete Mixer' },
  { icon: '🦺', name: 'Boom Lift /\nScissor Lift', category: 'Boom Lift / Scissor Lift' },
  { icon: '🚛', name: 'Dumper /\nTipper Truck', category: 'Dumper / Tipper Truck' },
  { icon: '🚗', name: 'Transit\nMixer', category: 'Transit Mixer' },
  { icon: '🛻', name: 'Pickup /\nMini Truck', category: 'Pickup / Mini Truck' },
  { icon: '🪜', name: 'Scaffolding', category: 'Scaffolding' },
  { icon: '🪵', name: 'Shuttering /\nCentering Plates', category: 'Shuttering / Centering Plates' },
  { icon: '🔩', name: 'Props\nSupports', category: 'Props Supports' },
  { icon: '🧱', name: 'Formwork\nMaterials', category: 'Formwork Materials' },
  { icon: '⚡', name: 'Generator', category: 'Generator' },
  { icon: '💧', name: 'Water\nPump', category: 'Water Pump' },
];

const materialSuppliers = [
  { icon: '🏪', name: 'Building\nMaterial Store', category: 'Building Material Store' },
  { icon: '🏗️', name: 'Cement & Steel\nSupplier', category: 'Cement & Steel Supplier' },
  { icon: '⚡', name: 'Electrical\nShop', category: 'Electrical Shop' },
  { icon: '🔧', name: 'Plumbing &\nSanitary Shop', category: 'Plumbing & Sanitary Shop' },
  { icon: '🟫', name: 'Tile & Marble\nStore', category: 'Tile & Marble Store' },
  { icon: '🎨', name: 'Paint\nShop', category: 'Paint Shop' },
  { icon: '🪵', name: 'Plywood &\nFurniture Store', category: 'Plywood & Furniture Store' },
  { icon: '🪟', name: 'Glass &\nAluminium Shop', category: 'Glass & Aluminium Shop' },
];

const banners = [
  { bg: ['#1a1a2e', '#0f3460'], title: 'Mehta\nBuilders Ltd', tag: 'Featured Developer', emoji: '🏢' },
  { bg: ['#2D1B00', '#7A5000'], title: 'Shree Cement\nWholesale', tag: 'Cement Supplier', emoji: '🏗️' },
  { bg: ['#0A2818', '#1E6B3A'], title: 'Learn AutoCAD\nfrom Scratch', tag: 'Top Course', emoji: '📐' },
  { bg: ['#0A3D1A', '#FF6600'], title: "Let's Be a Part of\nIndia's Revolution", tag: '🇮🇳 Nation Building', emoji: '🇮🇳' },
];

const materials = [
  { emoji: '🏗️', name: 'Shree Cement Co.', cat: 'Cement', price: '₹340/bag', rating: '4.8', location: 'Ahmedabad', bg: '#FFF7ED' },
  { emoji: '⚙️', name: 'Gujarat TMT Bars', cat: 'Steel', price: '₹58/kg', rating: '4.7', location: 'Vatva GIDC', bg: '#F1F5F9' },
  { emoji: '🟫', name: 'Morbi Tiles Hub', cat: 'Tiles', price: '₹45/sqft', rating: '4.9', location: 'Morbi', bg: '#FFFBEB' },
  { emoji: '🪵', name: 'Agarwal Timber', cat: 'Wood & Ply', price: '₹90/sqft', rating: '4.6', location: 'Surat', bg: '#FFF7ED' },
  { emoji: '🎨', name: 'Asian Paints Dealer', cat: 'Paint', price: '₹280/ltr', rating: '4.8', location: 'Navrangpura', bg: '#FDF4FF' },
];

const jobs = [
  { icon: '🏗️', title: 'Site Engineer', company: 'Shapoorji Pallonji', location: 'Ahmedabad', pay: '₹45K/mo', tags: ['Full Time', 'Civil'] },
  { icon: '📐', title: 'AutoCAD Draftsman', company: 'Design Studio', location: 'Surat', pay: '₹25K/mo', tags: ['Part Time', 'CAD'] },
  { icon: '🔌', title: 'Electrical Supervisor', company: 'L&T Construction', location: 'Gandhinagar', pay: '₹55K/mo', tags: ['Full Time', 'Urgent'] },
];

const prices = [
  { icon: '🏗️', label: 'Cement', value: '₹340/bag', dir: 'up' },
  { icon: '⚙️', label: 'Steel', value: '₹58/kg', dir: 'down' },
  { icon: '🟫', label: 'Tiles', value: '₹45/sqft', dir: 'stable' },
  { icon: '🎨', label: 'Paint', value: '₹280/ltr', dir: 'up' },
  { icon: '🏭', label: 'RMC', value: '₹4,200/m³', dir: 'down' },
  { icon: '🪵', label: 'Plywood', value: '₹90/sqft', dir: 'stable' },
  { icon: '🔩', label: 'TMT Bar', value: '₹62/kg', dir: 'up' },
];

const emergency = [
  { icon: '⚡', name: 'Electrician', status: 'Available Now', dot: '#4CAF50', category: 'Electrical' },
  { icon: '🔧', name: 'Plumber', status: 'Available Now', dot: '#4CAF50', category: 'Plumbing' },
  { icon: '🎨', name: 'Painter', status: '30 min away', dot: '#FF9800', category: 'Painters' },
  { icon: '❄️', name: 'AC Repair', status: 'Available Now', dot: '#4CAF50', category: 'HVAC Engineer' },
  { icon: '🔒', name: 'Locksmith', status: 'Available Now', dot: '#4CAF50', category: 'Locksmith' },
];

const tenders = [
  { name: 'G+10 Residential', location: 'Bodakdev', budget: '₹2.5 Cr', days: 5 },
  { name: 'Commercial Complex', location: 'SG Highway', budget: '₹8 Cr', days: 12 },
  { name: 'School Building', location: 'Gandhinagar', budget: '₹1.2 Cr', days: 3 },
  { name: 'IT Park Phase 2', location: 'GIFT City', budget: '₹15 Cr', days: 9 },
];


export default function HomeScreen({ navigation }) {
  const { width } = useWindowDimensions();
  const bannerRef = useRef(null);
  const [bannerIndex, setBannerIndex] = useState(0);
  const [contractorsExpanded, setContractorsExpanded] = useState(false);
  const [professionalsExpanded, setProfessionalsExpanded] = useState(false);
  const [companiesExpanded, setCompaniesExpanded] = useState(false);
  const [materialSuppliersExpanded, setMaterialSuppliersExpanded] = useState(false);
  const [rentalsExpanded, setRentalsExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex(prev => {
        const next = (prev + 1) % banners.length;
        bannerRef.current?.scrollTo({ x: next * (width - 28), animated: true });
        return next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [width]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brandRow}>
            <View style={styles.brandLogo}>
              <Text style={{ fontSize: 18 }}>🏗️</Text>
            </View>
            <Text style={styles.brandName}>
              Construction <Text style={{ color: '#FC8019' }}>Corner</Text>
            </Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('Notifications')}>
              <Text style={{ fontSize: 18 }}>🔔</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('ChatList')}>
              <Text style={{ fontSize: 18 }}>💬</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* LOCATION BAR */}
        <View style={styles.locationBar}>
          <Text style={styles.locationText}>📍 Ahmedabad, Gujarat  ▾</Text>
          <TouchableOpacity onPress={() => Alert.alert('Change Location', 'Coming soon!')}>
            <Text style={styles.locationChange}>Change</Text>
          </TouchableOpacity>
        </View>

        {/* SEARCH */}
        <TouchableOpacity style={styles.searchBar} onPress={() => navigation.navigate('Search')} activeOpacity={0.8}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search professionals, materials...</Text>
          <View style={styles.filterBtn}>
            <Text style={{ fontSize: 14 }}>⚙️</Text>
          </View>
        </TouchableOpacity>

        {/* NAV TABS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.navTabs}>
          {['For You', 'Professionals', 'Materials', 'Jobs', 'Courses', 'Tenders'].map((tab, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.navTab, i === 0 && styles.navTabActive]}
              onPress={() => {
                if (tab === 'Jobs') navigation.navigate('Jobs');
                else if (tab === 'Courses') navigation.navigate('Courses');
                else if (tab === 'Professionals') navigation.navigate('ProfessionalCategory');
                else if (tab === 'Materials') navigation.navigate('MaterialMarketplace');
                else if (tab === 'Tenders') navigation.navigate('Tenders');
              }}
            >
              <Text style={[styles.navTabText, i === 0 && styles.navTabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* BANNERS */}
        <View style={styles.sectionPad}>
          <ScrollView
            ref={bannerRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 28));
              setBannerIndex(idx);
            }}
          >
            {banners.map((b, i) => (
              <TouchableOpacity key={i} style={[styles.bannerSlide, { width: width - 28, backgroundColor: b.bg[1] }]}>
                <View style={styles.bannerContent}>
                  <View>
                    <Text style={styles.bannerTag}>{b.tag}</Text>
                    <Text style={styles.bannerTitle}>{b.title}</Text>
                    <Text style={styles.bannerCta}>View Details →</Text>
                  </View>
                  <Text style={styles.bannerEmoji}>{b.emoji}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.dotsRow}>
            {banners.map((_, i) => (
              <View key={i} style={[styles.dot, i === bannerIndex && styles.dotActive]} />
            ))}
          </View>
        </View>

        {/* ── PRICE TICKER ── */}
        <View style={styles.tickerWrap}>
          <Text style={styles.tickerLabel}>Live Prices</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tickerRow}>
            {prices.map((p, i) => {
              const arrow = p.dir === 'up' ? '↑' : p.dir === 'down' ? '↓' : '→';
              const arrowColor = p.dir === 'up' ? '#E53935' : p.dir === 'down' ? '#43A047' : '#888';
              return (
                <View key={i} style={styles.tickerPill}>
                  <Text style={styles.tickerIcon}>{p.icon}</Text>
                  <Text style={styles.tickerName}>{p.label}</Text>
                  <Text style={styles.tickerValue}>{p.value}</Text>
                  <Text style={[styles.tickerArrow, { color: arrowColor }]}>{arrow}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* ── EMERGENCY SERVICES ── */}
        <View style={styles.secHead}>
          <View>
            <Text style={styles.secTitle}>🆘 Need Someone Urgently?</Text>
            <Text style={styles.emergencySubtitle}>Available within 2 hours</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScrollRow}>
          {emergency.map((e, i) => (
            <TouchableOpacity
              key={i}
              style={styles.emergencyCard}
              onPress={() => navigation.navigate('CategoryList', { category: e.category, profileType: 'worker' })}
            >
              <Text style={styles.emergencyEmoji}>{e.icon}</Text>
              <Text style={styles.emergencyName}>{e.name}</Text>
              <View style={styles.emergencyStatusRow}>
                <View style={[styles.statusDot, { backgroundColor: e.dot }]} />
                <Text style={styles.emergencyStatus}>{e.status}</Text>
              </View>
              <TouchableOpacity style={styles.bookNowBtn} onPress={() => navigation.navigate('CategoryList', { category: e.category, profileType: 'worker' })}>
                <Text style={styles.bookNowText}>Book Now</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── ACTIVE TENDERS ── */}
        <View style={styles.secHead}>
          <Text style={styles.secTitle}>📋 Active Tenders Near You</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Tenders')}>
            <Text style={styles.secLink}>See All →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScrollRow}>
          {tenders.map((t, i) => (
            <TouchableOpacity key={i} style={styles.tenderCard} onPress={() => navigation.navigate('Tenders')}>
              <Text style={styles.tenderName}>{t.name}</Text>
              <Text style={styles.tenderLocation}>📍 {t.location}</Text>
              <Text style={styles.tenderBudget}>{t.budget}</Text>
              <Text style={[styles.tenderDeadline, t.days <= 7 && { color: '#E53935' }]}>
                ⏳ {t.days} days left
              </Text>
              <TouchableOpacity style={styles.bidBtn} onPress={() => navigation.navigate('Tenders')}>
                <Text style={styles.bidBtnText}>View & Bid</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── COURSE OF THE DAY ── */}
        <View style={styles.secHead}>
          <Text style={styles.secTitle}>🎓 Course of the Day</Text>
        </View>
        <View style={styles.sectionPad}>
          <TouchableOpacity style={styles.courseCard} onPress={() => navigation.navigate('Courses')}>
            <View style={styles.courseLeft}>
              <Text style={styles.courseTag}>TODAY'S PICK</Text>
              <Text style={styles.courseName}>AutoCAD Complete Masterclass</Text>
              <Text style={styles.courseInstructor}>by Rahul Sharma</Text>
              <Text style={styles.courseRating}>⭐ 4.9 · 12,400 students</Text>
              <View style={styles.coursePriceRow}>
                <Text style={styles.coursePrice}>₹999</Text>
                <Text style={styles.courseMrp}>₹4,999</Text>
              </View>
              <TouchableOpacity style={styles.enrollBtn} onPress={() => navigation.navigate('Courses')}>
                <Text style={styles.enrollBtnText}>Enroll Now</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.courseEmoji}>📐</Text>
          </TouchableOpacity>
        </View>

        {/* ── SECTION DIVIDER ── */}
        <View style={{ height: 8, backgroundColor: '#F0F0F0', marginVertical: 8 }} />

        {/* CONTRACTORS */}
        <View style={styles.secHead}>
          <Text style={styles.secTitle}>Contractors</Text>
          <TouchableOpacity onPress={() => Alert.alert('Coming Soon!')}><Text style={styles.secLink}>See All →</Text></TouchableOpacity>
        </View>
        <Text style={styles.secSubtitle}>Companies with 10+ team members</Text>
        <View style={styles.sectionPad}>
          <View style={styles.iconsGrid}>
            {(contractorsExpanded ? contractors : contractors.slice(0, 8)).map((s, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.iconItem, { width: (width - 28) / 4 - 9 }]}
                onPress={() => navigation.navigate('CategoryList', { category: s.category, profileType: 'business' })}
              >
                <View style={[styles.iconBox, { backgroundColor: s.bg }]}>
                  <Text style={styles.iconEmoji}>{s.icon}</Text>
                </View>
                <Text style={styles.iconName}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {contractors.length > 8 && (
            <TouchableOpacity style={styles.seeMoreBtn} onPress={() => setContractorsExpanded(e => !e)}>
              <Text style={styles.seeMoreText}>
                {contractorsExpanded ? 'See Less ↑' : `See More (${contractors.length - 8} more) ↓`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* PROFESSIONALS */}
        <View style={styles.secHead}>
          <Text style={styles.secTitle}>Professionals</Text>
          <TouchableOpacity onPress={() => Alert.alert('Coming Soon!')}><Text style={styles.secLink}>See All →</Text></TouchableOpacity>
        </View>
        <View style={styles.sectionPad}>
          <View style={styles.iconsGrid}>
            {(professionalsExpanded ? professionals : professionals.slice(0, 8)).map((s, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.iconItem, { width: (width - 28) / 4 - 9 }]}
                onPress={() => navigation.navigate('CategoryList', { category: s.category, profileType: 'professional' })}
              >
                <View style={styles.profIconBox}>
                  <Text style={styles.iconEmoji}>{s.icon}</Text>
                </View>
                <Text style={styles.iconName}>{s.name}</Text>
                <Text style={styles.profCount}>120+</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.seeMoreBtn} onPress={() => setProfessionalsExpanded(e => !e)}>
            <Text style={styles.seeMoreText}>
              {professionalsExpanded ? 'See Less ↑' : `See More (${professionals.length - 8} more) ↓`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* CONSTRUCTION COMPANIES */}
        <View style={styles.secHead}>
          <Text style={styles.secTitle}>Construction Companies</Text>
          <TouchableOpacity onPress={() => navigation.navigate('B2B')}><Text style={styles.secLink}>See All →</Text></TouchableOpacity>
        </View>
        <View style={styles.sectionPad}>
          <View style={styles.iconsGrid}>
            {(companiesExpanded ? companies : companies.slice(0, 8)).map((s, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.iconItem, { width: (width - 28) / 4 - 9 }]}
                onPress={() => navigation.navigate('CategoryList', { category: s.category, profileType: 'business' })}
              >
                <View style={styles.profIconBox}>
                  <Text style={styles.iconEmoji}>{s.icon}</Text>
                </View>
                <Text style={styles.iconName}>{s.name}</Text>
                <Text style={styles.profCount}>120+</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.seeMoreBtn} onPress={() => setCompaniesExpanded(e => !e)}>
            <Text style={styles.seeMoreText}>
              {companiesExpanded ? 'See Less ↑' : `See More (${companies.length - 8} more) ↓`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* MATERIAL SUPPLIERS GRID */}
        <View style={styles.secHead}>
          <Text style={styles.secTitle}>Material Suppliers</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MaterialMarketplaceScreen')}><Text style={styles.secLink}>See All →</Text></TouchableOpacity>
        </View>
        <View style={styles.sectionPad}>
          <View style={styles.iconsGrid}>
            {(materialSuppliersExpanded ? materialSuppliers : materialSuppliers.slice(0, 8)).map((s, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.iconItem, { width: (width - 28) / 4 - 9 }]}
                onPress={() => navigation.navigate('CategoryList', { category: s.category, profileType: 'supplier' })}
              >
                <View style={styles.profIconBox}>
                  <Text style={styles.iconEmoji}>{s.icon}</Text>
                </View>
                <Text style={styles.iconName}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {materialSuppliers.length > 8 && (
            <TouchableOpacity style={styles.seeMoreBtn} onPress={() => setMaterialSuppliersExpanded(e => !e)}>
              <Text style={styles.seeMoreText}>
                {materialSuppliersExpanded ? 'See Less ↑' : `See More (${materialSuppliers.length - 8} more) ↓`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* FEATURED MATERIALS */}
        <View style={styles.secHead}>
          <Text style={styles.secTitle}>Featured Materials</Text>
          <TouchableOpacity onPress={() => navigation.navigate('MaterialMarketplace')}><Text style={styles.secLink}>See All →</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.materialsRow}>
          {materials.map((m, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.materialCard, { backgroundColor: m.bg }]}
              onPress={() => navigation.navigate('CategoryList', { category: m.cat, profileType: 'supplier' })}
            >
              <Text style={styles.materialEmoji}>{m.emoji}</Text>
              <Text style={styles.materialName} numberOfLines={2}>{m.name}</Text>
              <Text style={styles.materialCat}>{m.cat}</Text>
              <Text style={styles.materialPrice}>{m.price}</Text>
              <View style={styles.materialMeta}>
                <Text style={styles.materialRating}>⭐ {m.rating}</Text>
                <Text style={styles.materialLoc} numberOfLines={1}>{m.location}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* RENTALS */}
        <View style={styles.secHead}>
          <Text style={styles.secTitle}>Equipment Rentals</Text>
          <TouchableOpacity onPress={() => Alert.alert('Coming Soon!')}><Text style={styles.secLink}>See All →</Text></TouchableOpacity>
        </View>
        <View style={styles.sectionPad}>
          <View style={styles.iconsGrid}>
            {(rentalsExpanded ? rentals : rentals.slice(0, 8)).map((s, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.iconItem, { width: (width - 28) / 4 - 9 }]}
                onPress={() => navigation.navigate('CategoryList', { category: s.category, profileType: 'supplier' })}
              >
                <View style={styles.profIconBox}>
                  <Text style={styles.iconEmoji}>{s.icon}</Text>
                </View>
                <Text style={styles.iconName}>{s.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={styles.seeMoreBtn} onPress={() => setRentalsExpanded(e => !e)}>
            <Text style={styles.seeMoreText}>
              {rentalsExpanded ? 'See Less ↑' : `See More (${rentals.length - 8} more) ↓`}
            </Text>
          </TouchableOpacity>
        </View>

        {/* JOBS */}
        <View style={styles.secHead}>
          <Text style={styles.secTitle}>Latest Jobs</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Jobs')}><Text style={styles.secLink}>See All →</Text></TouchableOpacity>
        </View>
        <View style={styles.sectionPad}>
          {jobs.map((job, i) => (
            <TouchableOpacity
              key={i}
              style={styles.jobCard}
              onPress={() => navigation.navigate('Jobs')}
            >
              <View style={styles.jobIconWrap}>
                <Text style={{ fontSize: 24 }}>{job.icon}</Text>
              </View>
              <View style={styles.jobInfo}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobCompany}>{job.company}</Text>
                <Text style={styles.jobMeta}>📍 {job.location}  ·  {job.pay}</Text>
                <View style={styles.jobTags}>
                  {job.tags.map((t, j) => (
                    <View key={j} style={styles.jobTag}>
                      <Text style={styles.jobTagText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <Text style={styles.jobArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      <BottomNav navigation={navigation} active="Home" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1, backgroundColor: '#FAFAFA' },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 48,
    paddingBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandLogo: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FFF3E0',
    alignItems: 'center', justifyContent: 'center',
  },
  brandName: { fontSize: 18, fontWeight: '900', color: '#111' },
  headerIcons: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center', justifyContent: 'center',
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 14,
    marginBottom: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  searchPlaceholder: { flex: 1, fontSize: 14, color: '#AAAAAA' },
  filterBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: '#EEEEEE',
    alignItems: 'center', justifyContent: 'center',
  },

  // Nav tabs
  navTabs: { paddingLeft: 14, marginBottom: 8 },
  navTab: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 20, marginRight: 8,
    backgroundColor: '#F5F5F5',
  },
  navTabActive: { backgroundColor: '#111111' },
  navTabText: { fontSize: 13, fontWeight: '600', color: '#666' },
  navTabTextActive: { color: '#FFFFFF' },

  // Section layout
  sectionPad: { paddingHorizontal: 14, paddingBottom: 4 },
  secHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    marginTop: 20,
    marginBottom: 4,
  },
  secTitle: { fontSize: 18, fontWeight: '700', color: '#111111' },
  secLink: { fontSize: 13, fontWeight: '600', color: '#FC8019' },
  secSubtitle: { fontSize: 12, color: '#888', paddingHorizontal: 14, marginBottom: 10 },

  // Icon grid
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 4,
  },
  iconItem: { alignItems: 'center' },
  iconBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  profIconBox: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#EBF5FB',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  iconEmoji: { fontSize: 30 },
  iconName: { fontSize: 10, fontWeight: '700', color: '#111', textAlign: 'center', lineHeight: 14 },
  profCount: { fontSize: 9, color: '#888', fontWeight: '600', marginTop: 1 },

  seeMoreBtn: {
    marginTop: 10,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  seeMoreText: { fontSize: 13, fontWeight: '600', color: '#444' },

  // Banner
  bannerSlide: {
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 0,
    height: 130,
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
  },
  bannerTag: { fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginBottom: 4 },
  bannerTitle: { fontSize: 18, fontWeight: '900', color: '#FFFFFF', lineHeight: 24, marginBottom: 8 },
  bannerCta: { fontSize: 13, color: '#FFFFFF', fontWeight: '700' },
  bannerEmoji: { fontSize: 52 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#D0D0D0' },
  dotActive: { backgroundColor: '#FC8019', width: 16 },

  // Featured Materials
  materialsRow: { paddingHorizontal: 14, gap: 10, paddingBottom: 8 },
  materialCard: {
    width: 140,
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  materialEmoji: { fontSize: 32, marginBottom: 6 },
  materialName: { fontSize: 13, fontWeight: '800', color: '#111', marginBottom: 2, lineHeight: 17 },
  materialCat: { fontSize: 11, color: '#888', fontWeight: '500', marginBottom: 4 },
  materialPrice: { fontSize: 13, fontWeight: '900', color: '#FC8019', marginBottom: 6 },
  materialMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  materialRating: { fontSize: 11, fontWeight: '700', color: '#333' },
  materialLoc: { fontSize: 10, color: '#999', flex: 1, textAlign: 'right' },

  // Jobs
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 14,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  jobIconWrap: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: '#FFF3E0',
    alignItems: 'center', justifyContent: 'center',
  },
  jobInfo: { flex: 1 },
  jobTitle: { fontSize: 14, fontWeight: '800', color: '#111', marginBottom: 2 },
  jobCompany: { fontSize: 12, color: '#555', fontWeight: '600', marginBottom: 3 },
  jobMeta: { fontSize: 11, color: '#999', marginBottom: 6 },
  jobTags: { flexDirection: 'row', gap: 6 },
  jobTag: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6, backgroundColor: '#F0F0F0',
  },
  jobTagText: { fontSize: 10, fontWeight: '700', color: '#555' },
  jobArrow: { fontSize: 24, color: '#CCC', fontWeight: '300' },

  // Location bar
  locationBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 14, paddingVertical: 8,
    marginBottom: 10,
  },
  locationText: { fontSize: 13, fontWeight: '700', color: '#222' },
  locationChange: { fontSize: 13, fontWeight: '700', color: '#4CAF50' },

  // Price ticker
  tickerWrap: {
    backgroundColor: '#FFFFFF',
    paddingTop: 12, paddingBottom: 4,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  tickerLabel: { fontSize: 11, fontWeight: '700', color: '#888', paddingHorizontal: 14, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  tickerRow: { paddingHorizontal: 14, gap: 8, paddingBottom: 10 },
  tickerPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: '#EEEEEE',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  tickerIcon: { fontSize: 13 },
  tickerName: { fontSize: 11, fontWeight: '600', color: '#555' },
  tickerValue: { fontSize: 11, fontWeight: '800', color: '#111' },
  tickerArrow: { fontSize: 12, fontWeight: '800' },

  // Horizontal scroll common padding
  hScrollRow: { paddingHorizontal: 14, gap: 10, paddingBottom: 12 },

  // Emergency services
  emergencySubtitle: { fontSize: 11, color: '#E53935', fontWeight: '600', marginTop: 2 },
  emergencyCard: {
    width: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 14, padding: 14,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  emergencyEmoji: { fontSize: 36, marginBottom: 8 },
  emergencyName: { fontSize: 12, fontWeight: '800', color: '#111', marginBottom: 6, textAlign: 'center' },
  emergencyStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  emergencyStatus: { fontSize: 10, color: '#555', fontWeight: '500' },
  bookNowBtn: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  bookNowText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },

  // Active tenders
  tenderCard: {
    width: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  tenderName: { fontSize: 13, fontWeight: '800', color: '#111', marginBottom: 4 },
  tenderLocation: { fontSize: 11, color: '#888', marginBottom: 6 },
  tenderBudget: { fontSize: 14, fontWeight: '900', color: '#2E7D32', marginBottom: 4 },
  tenderDeadline: { fontSize: 11, fontWeight: '600', color: '#888', marginBottom: 10 },
  bidBtn: { backgroundColor: '#E8F5E9', borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  bidBtnText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },

  // Course of the day
  courseCard: {
    backgroundColor: '#1A237E',
    borderRadius: 16, padding: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  courseLeft: { flex: 1 },
  courseTag: { fontSize: 10, fontWeight: '800', color: 'rgba(255,255,255,0.6)', letterSpacing: 1, marginBottom: 6 },
  courseName: { fontSize: 16, fontWeight: '900', color: '#FFFFFF', lineHeight: 22, marginBottom: 4 },
  courseInstructor: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 6 },
  courseRating: { fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginBottom: 8 },
  coursePriceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  coursePrice: { fontSize: 18, fontWeight: '900', color: '#FFFFFF' },
  courseMrp: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textDecorationLine: 'line-through' },
  enrollBtn: { backgroundColor: '#FC8019', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start' },
  enrollBtnText: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
  courseEmoji: { fontSize: 56, marginLeft: 12 },

});
