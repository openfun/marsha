import { requestStatus } from '../../types/api';
import { modelName } from '../../types/models';
import { TimedText } from '../../types/tracks';
import { mapStateToProps } from './DashboardTimedTextPaneConnected';

describe('<DashboardTimedTextPaneConnected />', () => {
  describe('mapStateToProps()', () => {
    it('builds the props from a successful query', () => {
      expect(
        mapStateToProps({
          context: {
            jwt: 'some token',
          },
          resources: {
            [modelName.TIMEDTEXTTRACKS]: {
              byId: {
                42: { id: '42' } as TimedText,
                84: { id: '84' } as TimedText,
                168: { id: '168' } as TimedText,
              },
              currentQuery: {
                items: { 0: '42', 1: '84', 2: '168' },
                status: requestStatus.SUCCESS,
              },
            },
          },
        } as any),
      ).toEqual({
        jwt: 'some token',
        timedtexttracks: {
          objects: [{ id: '42' }, { id: '84' }, { id: '168' }],
          status: requestStatus.SUCCESS,
        },
      });
    });

    it('builds the props from a failed query', () => {
      expect(
        mapStateToProps({
          context: {
            jwt: 'some token',
          },
          resources: {
            [modelName.TIMEDTEXTTRACKS]: {
              byId: {},
              currentQuery: {
                items: {},
                status: requestStatus.FAILURE,
              },
            },
          },
        } as any),
      ).toEqual({
        jwt: 'some token',
        timedtexttracks: {
          objects: [],
          status: requestStatus.FAILURE,
        },
      });
    });
  });
});
