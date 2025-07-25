import React, { useState, useEffect } from 'react';
import { useIdleTimer } from 'react-idle-timer';
import { useNavigate } from 'react-router-dom';
import { ScribeModal, ScribeBtn } from '../components/ScribeComponents';
import { HeaderContainer, Body } from '../pages/util/modalDesignComponents';
import { H1 } from '../components/typography';
import { BtnContainer } from '../components/designedComponents';

// 20 minutes
const timeout = 20 * 60 * 1000;

// 2 minutes, this timer occurs minus from timeout, so at minute 18.
const promptBeforeIdle = 2 * 60 * 1000;
const throttle = 500;

export default function IdleTimer() {
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();

  const onIdle = () => {
    setIsOpen(false);
    navigate('/logout');
  };

  const onActive = () => setIsOpen(false);
  const onPrompt = () => setIsOpen(true);

  const { activate, getRemainingTime } = useIdleTimer({
    onIdle,
    onActive,
    onPrompt,
    stopOnIdle: true,
    timeout,
    promptBeforeIdle,
    throttle,
  });

  const [remainingSecs, setRemainingSecs] = useState(promptBeforeIdle / 1000);

  const handleStillHere = () => {
    activate();
    setIsOpen(false);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (isOpen && remainingSecs > 0) {
        setRemainingSecs(getRemainingTime() / 1000);
      } else clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingSecs, isOpen]);

  const remainingTimeMessage = () => {
    const minutes = Math.floor(remainingSecs / 60);
    const seconds = Math.ceil(remainingSecs % 60);

    return `We will log you out in ${minutes} minutes and ${seconds} seconds.`;
  };

  return (
    <ScribeModal dataTestId="idleModal" showModal={isOpen} width="md">
      <>
        <HeaderContainer className="mb-2">
          <H1 className="noMarginHeader"> Are You Still Here?</H1>
        </HeaderContainer>

        <Body>
          <div className="mb-4">{remainingTimeMessage()}</div>

          <BtnContainer className="mb-4">
            <ScribeBtn id="extendSession" dataTestId="extendSession" onClick={handleStillHere}>
              <div>Extend Session</div>
            </ScribeBtn>

            <ScribeBtn variant="secondary" id="logout" dataTestId="logout" onClick={onIdle}>
              <div>Logout</div>
            </ScribeBtn>
          </BtnContainer>
        </Body>
      </>
    </ScribeModal>
  );
}
