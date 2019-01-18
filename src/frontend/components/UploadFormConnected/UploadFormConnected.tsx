import { connect } from 'react-redux';
import { Dispatch } from 'redux';

import { addResource } from '../../data/genericReducers/resourceById/actions';
import { RootState } from '../../data/rootReducer';
import { appStateSuccess } from '../../types/AppData';
import { modelName } from '../../types/models';
import { UploadableObject } from '../../types/tracks';
import { UploadForm } from '../UploadForm/UploadForm';

/** Props shape for the UploadFormConnected component. */
interface UploadFormConnectedProps {
  objectId: UploadableObject['id'];
  objectType: modelName;
}

/**
 * Use the objectType & objectId from the props to get the actual object.
 * Also, just pass the jwt and objectType along.
 */
export const mapStateToProps = (
  state: RootState<appStateSuccess>,
  { objectId, objectType }: UploadFormConnectedProps,
) => ({
  jwt: state.context.jwt,
  object:
    state.resources[objectType]!.byId &&
    state.resources[objectType]!.byId[objectId],
  objectType,
});

/** Create a function that updates a single object record in the store. */
const mapDispatchToProps = (
  dispatch: Dispatch,
  { objectType }: UploadFormConnectedProps,
) => ({
  updateObject: (object: UploadableObject) =>
    dispatch(addResource(objectType, object)),
});

/**
 * Component. Displays the `<UploadForm />` to allow a file upload to a related object.
 * @param objectId The ID for the relevant object record for which we're uploading a file.
 * @param objectType The model name for the object for which we're uploading a file.
 */
export const UploadFormConnected = connect(
  mapStateToProps,
  mapDispatchToProps,
)(UploadForm);
