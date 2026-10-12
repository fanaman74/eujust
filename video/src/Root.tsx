import {Composition} from 'remotion';
import {EuropeMap} from './Composition';

export const RemotionRoot: React.FC = () => <>
  <Composition id="EuropeLandscape" component={EuropeMap} width={1920} height={1080} fps={30} durationInFrames={360} defaultProps={{portrait: false, accent: '#bce57a'}} />
  <Composition id="EuropePortrait" component={EuropeMap} width={1080} height={1920} fps={30} durationInFrames={360} defaultProps={{portrait: true, accent: '#bce57a'}} />
</>;
