import type { EntryType } from '../lib/types';
import { activityColors } from '../theme';
import type { Dict } from '../i18n/en';

export type ActivityGroupKey =
  | 'feed'
  | 'pump'
  | 'diaper'
  | 'sleep'
  | 'routine'
  | 'growth'
  | 'health';

export type ActivityDef = {
  type: EntryType;
  labelKey: keyof Dict;
};

export type GroupDef = {
  key: ActivityGroupKey;
  titleKey: keyof Dict;
  emptyKey: keyof Dict;
  color: string;
  activities: ActivityDef[];
};

// Maps each entry type to the color of its group (for History/Trends markers).
export const typeColor: Record<EntryType, string> = {
  breastfeed: activityColors.feed,
  bottle: activityColors.feed,
  solids: activityColors.feed,
  pump: activityColors.pump,
  diaper: activityColors.diaper,
  sleep: activityColors.sleep,
  routine: activityColors.routine,
  weight: activityColors.growth,
  height: activityColors.growth,
  head: activityColors.growth,
  milestone: activityColors.growth,
  medical: activityColors.health,
  vaccine: activityColors.health,
};

export const groups: GroupDef[] = [
  {
    key: 'feed',
    titleKey: 'group_feed',
    emptyKey: 'empty_feed',
    color: activityColors.feed,
    activities: [
      { type: 'breastfeed', labelKey: 'act_breastfeed' },
      { type: 'bottle', labelKey: 'act_bottle' },
      { type: 'solids', labelKey: 'act_solids' },
    ],
  },
  {
    key: 'pump',
    titleKey: 'group_pump',
    emptyKey: 'empty_pump',
    color: activityColors.pump,
    activities: [{ type: 'pump', labelKey: 'act_pump' }],
  },
  {
    key: 'diaper',
    titleKey: 'group_diaper',
    emptyKey: 'empty_diaper',
    color: activityColors.diaper,
    activities: [{ type: 'diaper', labelKey: 'act_diaper' }],
  },
  {
    key: 'sleep',
    titleKey: 'group_sleep',
    emptyKey: 'empty_sleep',
    color: activityColors.sleep,
    activities: [{ type: 'sleep', labelKey: 'act_sleep' }],
  },
  {
    key: 'routine',
    titleKey: 'group_routine',
    emptyKey: 'empty_routine',
    color: activityColors.routine,
    activities: [{ type: 'routine', labelKey: 'act_routine' }],
  },
  {
    key: 'growth',
    titleKey: 'group_growth',
    emptyKey: 'empty_growth',
    color: activityColors.growth,
    activities: [
      { type: 'weight', labelKey: 'act_weight' },
      { type: 'height', labelKey: 'act_height' },
      { type: 'head', labelKey: 'act_head' },
      { type: 'milestone', labelKey: 'act_milestone' },
    ],
  },
  {
    key: 'health',
    titleKey: 'group_health',
    emptyKey: 'empty_health',
    color: activityColors.health,
    activities: [
      { type: 'medical', labelKey: 'act_medical' },
      { type: 'vaccine', labelKey: 'act_vaccine' },
    ],
  },
];

export const labelKeyForType: Record<EntryType, keyof Dict> = {
  breastfeed: 'act_breastfeed',
  bottle: 'act_bottle',
  solids: 'act_solids',
  pump: 'act_pump',
  diaper: 'act_diaper',
  sleep: 'act_sleep',
  routine: 'act_routine',
  weight: 'act_weight',
  height: 'act_height',
  head: 'act_head',
  milestone: 'act_milestone',
  medical: 'act_medical',
  vaccine: 'act_vaccine',
};
