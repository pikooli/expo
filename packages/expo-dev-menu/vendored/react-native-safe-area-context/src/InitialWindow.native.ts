import { requireNativeModule } from 'expo';
import { Metrics } from './SafeArea.types';

const RNCSafeAreaProviderConstants = requireNativeModule('RNCSafeAreaProvider');

export const initialWindowMetrics = (
  RNCSafeAreaProviderConstants != null ? RNCSafeAreaProviderConstants.initialWindowMetrics : null
) as Metrics | null;

/**
 * @deprecated
 */
export const initialWindowSafeAreaInsets = initialWindowMetrics?.insets;
