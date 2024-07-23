import { requireOptionalNativeModule } from 'expo';
import Constants, { AppOwnership } from 'expo-constants';
// @ts-ignore -- optional interface, will gracefully degrade to `any` if not installed
import type { ExpoUpdatesModule } from 'expo-updates';

import { getManifestBaseUrl } from './AssetUris';

const ExpoUpdates = requireOptionalNativeModule<ExpoUpdatesModule>('ExpoUpdates');

const isRunningInExpoGo = Constants.appOwnership === AppOwnership.Expo;

// expo-updates (and Expo Go expo-updates override) manages assets from updates and exposes
// the ExpoUpdates.localAssets constant containing information about the assets.
const expoUpdatesIsInstalledAndEnabled = !!ExpoUpdates?.isEnabled;
const expoUpdatesIsUsingEmbeddedAssets = ExpoUpdates?.isUsingEmbeddedAssets;

// if expo-updates is installed but we're running directly from the embedded bundle, we don't want
// to override the AssetSourceResolver.
const shouldUseUpdatesAssetResolution =
  expoUpdatesIsInstalledAndEnabled && !expoUpdatesIsUsingEmbeddedAssets;

// Expo Go always uses the updates module for asset resolution (local assets) since it
// overrides the expo-updates module.
export const IS_ENV_WITH_LOCAL_ASSETS = isRunningInExpoGo || shouldUseUpdatesAssetResolution;

// Get the localAssets property from the ExpoUpdates native module so that we do
// not need to include expo-updates as a dependency of expo-asset
export function getLocalAssets(): Record<string, string> {
  return ExpoUpdates?.localAssets ?? {};
}

export function getManifest2(): typeof Constants.__unsafeNoWarnManifest2 {
  return Constants.__unsafeNoWarnManifest2;
}

// Compute manifest base URL if available
export const manifestBaseUrl = Constants.experienceUrl
  ? getManifestBaseUrl(Constants.experienceUrl)
  : null;
