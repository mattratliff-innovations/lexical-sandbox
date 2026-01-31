/* eslint-disable react/jsx-props-no-spreading */
import { DrButton, DrIcon } from '@druid/druid';
import PropTypes from 'prop-types';

export function AddContentBtn({ clickHandler, text, btnTestId }) {
  return (
    <DrButton className="add-content-btn" data-testid={btnTestId} variant="secondary" size="small" aria-label={text} onClick={clickHandler}>
      <DrIcon slot="start-icon" iconName="plus" color="black" />
      <p className="add-content-btn__text">{text}</p>
    </DrButton>
  );
}

AddContentBtn.propTypes = {
  btnTestId: PropTypes.string.isRequired,
  clickHandler: PropTypes.func.isRequired,
  text: PropTypes.string.isRequired,
};

// eslint-disable-next-line react/prop-types
export function ContentSection({ Component, data = [], ...props }) {
  let count = 0;
  return (
    <>
      {data.map((item) => {
        count += 1;
        return <Component key={`item-${count}`} standardItem={item} itemGroup={item} {...props} />;
      })}
    </>
  );
}
