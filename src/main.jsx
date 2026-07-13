import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import HeroSection from './components/HeroSection';
import ActiveObjectives from './components/ActiveObjectives';
import SysArmament from './components/SysArmament';
import MutagenCard from './components/MutagenCard';

// Mount Hero Section
const heroRoot = document.getElementById('react-hero-section');
if (heroRoot) {
  ReactDOM.createRoot(heroRoot).render(
    <React.StrictMode>
      <HeroSection />
    </React.StrictMode>
  );
}

// Mount Active Objectives
const objectivesRoot = document.getElementById('react-operational-specs');
if (objectivesRoot) {
  ReactDOM.createRoot(objectivesRoot).render(
    <React.StrictMode>
      <ActiveObjectives />
    </React.StrictMode>
  );
}

// Mount Sys Armament (Skills)
const skillsRoot = document.getElementById('react-sys-armament');
if (skillsRoot) {
  ReactDOM.createRoot(skillsRoot).render(
    <React.StrictMode>
      <SysArmament />
    </React.StrictMode>
  );
}

// Mount Mutagen Card
const mutagenRoot = document.getElementById('react-mutagen-card');
if (mutagenRoot) {
  ReactDOM.createRoot(mutagenRoot).render(
    <React.StrictMode>
      <MutagenCard />
    </React.StrictMode>
  );
}

