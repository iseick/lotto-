"use server";

import { revalidatePath } from "next/cache";
import { createStore, type StoreInput } from "@/lib/stores";
import { createPurchase, type PurchaseInput } from "@/lib/purchases";
import { addManualDraw, type ManualDrawInput } from "@/lib/draws";
import { scoreRound } from "@/lib/score";

export type ActionResult =
  | { ok: true; id?: number }
  | { ok: false; error: string };

function fail(e: unknown): ActionResult {
  return { ok: false, error: e instanceof Error ? e.message : String(e) };
}

export async function createStoreAction(
  input: StoreInput
): Promise<ActionResult> {
  try {
    const id = await createStore(input);
    revalidatePath("/stores");
    revalidatePath("/purchases/new");
    return { ok: true, id };
  } catch (e) {
    return fail(e);
  }
}

export async function createPurchaseAction(
  input: PurchaseInput
): Promise<ActionResult> {
  try {
    const id = await createPurchase(input);
    // 그 회차 당첨번호가 이미 있으면 즉시 채점.
    await scoreRound(input.round);
    revalidatePath("/purchases");
    revalidatePath("/");
    return { ok: true, id };
  } catch (e) {
    return fail(e);
  }
}

export async function addDrawAction(
  input: ManualDrawInput
): Promise<ActionResult> {
  try {
    await addManualDraw(input);
    // 이 회차를 구매한 게임들을 자동 채점.
    await scoreRound(input.round);
    revalidatePath("/draws");
    revalidatePath("/purchases");
    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
