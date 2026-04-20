import { HOME_CONTENT } from '../model/homeModel';

export function useHomePresenter({ onEnterExperience }) {
  return {
    content: HOME_CONTENT,
    onEnterExperience,
  };
}
