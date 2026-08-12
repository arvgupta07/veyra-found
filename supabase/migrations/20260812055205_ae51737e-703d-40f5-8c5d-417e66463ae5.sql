REVOKE ALL ON FUNCTION public.purge_connection_between(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.blocks_purge_connection() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.disconnect_founder(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.disconnect_founder(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_connection_between(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.blocks_purge_connection() TO service_role;