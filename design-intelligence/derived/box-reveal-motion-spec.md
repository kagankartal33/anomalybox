# Box Reveal Motion Spec

## Purpose

The box reveal must make a purchased ViralBox feel private, premium, and intentional. Motion communicates state: sealed, hovered, confirming, opening, revealed.

## States

1. Sealed
   - Box rests still.
   - Lid and ribbon are aligned.
   - Label says sealed creator box.

2. Hover / focus
   - Lid lifts 8-12px and rotates 2-4 degrees.
   - Glow becomes slightly stronger.
   - Motion duration: 400-550ms.

3. Confirmation modal
   - No cards are visible yet.
   - Copy reinforces that the reveal is private and saved.

4. Revealed
   - Lid remains open.
   - Cards rise with staggered offsets.
   - The final state must be readable and static.

## Timing

- Hover: 450ms ease-out.
- Reveal card rise: 650-900ms using gentle cubic-bezier.
- Stagger: 80-140ms between cards.
- Reduced motion: no rotation, no large movement; use opacity/state change only.

## Visual Quality

- Classic Red: warm red body, darker red shell, cream ribbon.
- Signature Purple: deep purple shell, royal purple body, lavender ribbon.
- Shadows should be soft and layered.
- Avoid bouncing, spinning, confetti, glitter overload, and abrupt transforms.
